import { Injectable } from '@nestjs/common';
import { EstadoPago, MetodoPagoGateway } from '@prisma/client';

type ProcesarPagoInput = {
  monto: number;
  metodo: MetodoPagoGateway;
  titular?: string;
  tarjetaNumero?: string;
  vencimiento?: string;
  cvv?: string;
  bancoOrigen?: string;
  referenciaBancaria?: string;
  pasarela?: string;
};

type GatewayResult = {
  estado: EstadoPago;
  autorizacion?: string;
  motivoRechazo?: string;
  ultimos4?: string;
  marcaTarjeta?: string;
  tokenPasarela?: string;
  metadata: Record<string, unknown>;
};

@Injectable()
export class PaymentGatewayProvider {
  async procesar(input: ProcesarPagoInput): Promise<GatewayResult> {
    const started = Date.now();
    const baseMetadata = {
      procesador: 'HotelPay Authorization Core',
      ambiente: 'sandbox_operativo',
      procesadoEn: new Date().toISOString(),
      metodo: input.metodo,
      pasarelaObjetivo: input.pasarela ?? 'gateway_router',
    };

    const result = this.resolverResultado(input);

    return {
      ...result,
      metadata: this.cleanMetadata({
        ...baseMetadata,
        latenciaMs: Date.now() - started + this.randomInt(180, 920),
        reglaDecision: result.metadata.reglaDecision,
        riesgo: result.metadata.riesgo,
        bancoOrigen: input.bancoOrigen,
        referenciaBancaria: input.referenciaBancaria,
        marcaTarjeta: result.marcaTarjeta,
      }),
    };
  }

  private resolverResultado(input: ProcesarPagoInput): GatewayResult {
    if (input.monto <= 0) {
      return this.rechazado('Monto invalido', 'amount_invalid', 'alto');
    }

    switch (input.metodo) {
      case 'tarjeta':
        return this.procesarTarjeta(input);
      case 'transferencia':
        return this.procesarTransferencia(input);
      case 'efectivo':
        return this.aprobado('cash_verified', 'bajo');
      case 'wallet':
        return input.monto > 1500
          ? this.pendiente('wallet_risk_review', 'medio')
          : this.aprobado('wallet_authorized', 'bajo');
      case 'link_pago':
        return this.pendiente('payment_link_waiting_customer', 'medio');
      default:
        return this.rechazado('Metodo de pago no soportado', 'method_not_supported', 'alto');
    }
  }

  private procesarTarjeta(input: ProcesarPagoInput): GatewayResult {
    const card = this.cleanCard(input.tarjetaNumero);
    const last4 = card.slice(-4);
    const marcaTarjeta = this.detectarMarcaTarjeta(card);

    if (card.length < 13 || card.length > 19 || !this.luhn(card)) {
      return this.rechazado('Numero de tarjeta invalido', 'card_luhn_failed', 'alto');
    }

    if (!this.vencimientoVigente(input.vencimiento)) {
      return this.rechazado('Tarjeta vencida', 'card_expired', 'alto');
    }

    if (!input.cvv || !/^\d{3,4}$/.test(input.cvv)) {
      return this.rechazado('CVV invalido', 'cvv_invalid', 'alto');
    }

    if (last4 === '0002') {
      return this.rechazado(
        'Fondos insuficientes',
        'issuer_insufficient_funds',
        'medio',
        {
          ultimos4: last4,
          marcaTarjeta,
          tokenPasarela: this.generarTokenPasarela(marcaTarjeta),
        },
      );
    }

    if (last4 === '0069') {
      return this.rechazado(
        'Tarjeta reportada por el banco emisor',
        'issuer_card_restricted',
        'alto',
        {
          ultimos4: last4,
          marcaTarjeta,
          tokenPasarela: this.generarTokenPasarela(marcaTarjeta),
        },
      );
    }

    if (input.monto >= 2500) {
      return this.pendiente('issuer_3ds_review', 'medio', {
        ultimos4: last4,
        marcaTarjeta,
        tokenPasarela: this.generarTokenPasarela(marcaTarjeta),
      });
    }

    return this.aprobado('issuer_authorized', 'bajo', {
      ultimos4: last4,
      marcaTarjeta,
      tokenPasarela: this.generarTokenPasarela(marcaTarjeta),
    });
  }

  private procesarTransferencia(input: ProcesarPagoInput): GatewayResult {
    const referencia = input.referenciaBancaria?.trim().toUpperCase();

    if (!input.bancoOrigen?.trim()) {
      return this.rechazado('Banco origen requerido', 'bank_required', 'medio');
    }

    if (!referencia || referencia.length < 6) {
      return this.rechazado('Referencia bancaria invalida', 'bank_reference_invalid', 'medio');
    }

    if (/(FAIL|RECHAZ|VOID|000000)$/.test(referencia)) {
      return this.rechazado('Transferencia rechazada por validacion bancaria', 'bank_transfer_rejected', 'alto');
    }

    if (input.monto >= 5000) {
      return this.pendiente('bank_compliance_review', 'medio');
    }

    return this.aprobado('bank_transfer_confirmed', 'bajo', {
      tokenPasarela: this.generarTokenPasarela('bank_transfer'),
    });
  }

  private aprobado(
    reglaDecision: string,
    riesgo: string,
    extra?: Pick<GatewayResult, 'ultimos4' | 'marcaTarjeta' | 'tokenPasarela'>,
  ): GatewayResult {
    return {
      estado: 'aprobado',
      autorizacion: this.generarCodigo('AUTH'),
      ...extra,
      metadata: { reglaDecision, riesgo },
    };
  }

  private pendiente(
    reglaDecision: string,
    riesgo: string,
    extra?: Pick<GatewayResult, 'ultimos4' | 'marcaTarjeta' | 'tokenPasarela'>,
  ): GatewayResult {
    return {
      estado: 'pendiente',
      autorizacion: this.generarCodigo('PEND'),
      ...extra,
      metadata: { reglaDecision, riesgo },
    };
  }

  private rechazado(
    motivoRechazo: string,
    reglaDecision: string,
    riesgo: string,
    extra?: Pick<GatewayResult, 'ultimos4' | 'marcaTarjeta' | 'tokenPasarela'>,
  ): GatewayResult {
    return {
      estado: 'rechazado',
      motivoRechazo,
      ...extra,
      metadata: { reglaDecision, riesgo },
    };
  }

  generarReferencia() {
    return this.generarCodigo('PAY');
  }

  private cleanCard(value?: string) {
    return (value ?? '').replace(/\D/g, '');
  }

  private detectarMarcaTarjeta(card: string) {
    if (/^4\d{12}(\d{3})?(\d{3})?$/.test(card)) return 'Visa';
    if (/^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(card)) {
      return 'Mastercard';
    }
    if (/^3[47]\d{13}$/.test(card)) return 'American Express';
    if (/^6(?:011|5\d{2})\d{12}$/.test(card)) return 'Discover';
    return 'Desconocida';
  }

  private luhn(card: string) {
    let sum = 0;
    let shouldDouble = false;

    for (let i = card.length - 1; i >= 0; i -= 1) {
      let digit = Number(card[i] ?? 0);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  private vencimientoVigente(value?: string) {
    if (!value || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return false;
    const [monthRaw, yearRaw] = value.split('/');
    const month = Number(monthRaw);
    const year = 2000 + Number(yearRaw);
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999);
    return lastDay >= new Date();
  }

  private generarCodigo(prefix: string) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private generarTokenPasarela(marca: string) {
    const normalized = marca.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const random = Math.random().toString(36).slice(2, 18);
    return `tok_${normalized}_${random}`;
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private cleanMetadata(metadata: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined),
    );
  }
}
