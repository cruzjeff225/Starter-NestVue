import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prismaModule';
import { PagosController } from './pagosController';
import { PaymentGatewayProvider } from './paymentGatewayProvider';
import { PagosService } from './pagosService';

@Module({
  imports: [PrismaModule],
  controllers: [PagosController],
  providers: [PagosService, PaymentGatewayProvider],
})
export class PagosModule {}
