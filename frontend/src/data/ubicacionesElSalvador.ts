export type UbicacionElSalvador = {
  departamento: string;
  municipio: string;
  distritos: string[];
};

export const ubicacionesElSalvador: UbicacionElSalvador[] = [
  { departamento: 'Ahuachapan', municipio: 'Ahuachapan Norte', distritos: ['Atiquizaya', 'El Refugio', 'San Lorenzo', 'Turin'] },
  { departamento: 'Ahuachapan', municipio: 'Ahuachapan Centro', distritos: ['Ahuachapan', 'Apaneca', 'Concepcion de Ataco', 'Tacuba'] },
  { departamento: 'Ahuachapan', municipio: 'Ahuachapan Sur', distritos: ['Guaymango', 'Jujutla', 'San Francisco Menendez', 'San Pedro Puxtla'] },
  { departamento: 'San Salvador', municipio: 'San Salvador Norte', distritos: ['Aguilares', 'El Paisnal', 'Guazapa'] },
  { departamento: 'San Salvador', municipio: 'San Salvador Oeste', distritos: ['Apopa', 'Nejapa'] },
  { departamento: 'San Salvador', municipio: 'San Salvador Este', distritos: ['Ilopango', 'San Martin', 'Soyapango', 'Tonacatepeque'] },
  { departamento: 'San Salvador', municipio: 'San Salvador Centro', distritos: ['Ayutuxtepeque', 'Mejicanos', 'San Salvador', 'Cuscatancingo', 'Ciudad Delgado'] },
  { departamento: 'San Salvador', municipio: 'San Salvador Sur', distritos: ['Panchimalco', 'Rosario de Mora', 'San Marcos', 'Santo Tomas', 'Santiago Texacuangos'] },
  { departamento: 'La Libertad', municipio: 'La Libertad Norte', distritos: ['Quezaltepeque', 'San Matias', 'San Pablo Tacachico'] },
  { departamento: 'La Libertad', municipio: 'La Libertad Centro', distritos: ['San Juan Opico', 'Ciudad Arce'] },
  { departamento: 'La Libertad', municipio: 'La Libertad Oeste', distritos: ['Colon', 'Jayaque', 'Sacacoyo', 'Tepecoyo', 'Talnique'] },
  { departamento: 'La Libertad', municipio: 'La Libertad Este', distritos: ['Antiguo Cuscatlan', 'Huizucar', 'Nuevo Cuscatlan', 'San Jose Villanueva', 'Zaragoza'] },
  { departamento: 'La Libertad', municipio: 'La Libertad Costa', distritos: ['Chiltiupan', 'Jicalapa', 'La Libertad', 'Tamanique', 'Teotepeque'] },
  { departamento: 'La Libertad', municipio: 'La Libertad Sur', distritos: ['Comasagua', 'Santa Tecla'] },
  { departamento: 'Chalatenango', municipio: 'Chalatenango Norte', distritos: ['La Palma', 'Citala', 'San Ignacio'] },
  { departamento: 'Cuscatlan', municipio: 'Cuscatlan Norte', distritos: ['Suchitoto', 'San Jose Guayabal', 'Oratorio de Concepcion', 'San Bartolome Perulapia', 'San Pedro Perulapan'] },
  { departamento: 'Cabanas', municipio: 'Cabanas Este', distritos: ['Sensuntepeque', 'Victoria', 'Dolores', 'Guacotecti', 'San Isidro'] },
  { departamento: 'Cabanas', municipio: 'Cabanas Oeste', distritos: ['Ilobasco', 'Tejutepeque', 'Jutiapa', 'Cinquera'] },
  { departamento: 'San Vicente', municipio: 'San Vicente Norte', distritos: ['Apastepeque', 'Santa Clara', 'San Ildefonso', 'San Esteban Catarina', 'San Sebastian', 'San Lorenzo', 'Santo Domingo'] },
  { departamento: 'San Vicente', municipio: 'San Vicente Sur', distritos: ['San Vicente', 'Guadalupe', 'Verapaz', 'Tepetitan', 'Tecoluca', 'San Cayetano Istepeque'] },
  { departamento: 'San Miguel', municipio: 'San Miguel Norte', distritos: ['Ciudad Barrios', 'Sesori', 'Nuevo Eden de San Juan', 'San Gerardo', 'San Luis de La Reina', 'Carolina', 'San Antonio del Mosco', 'Chapeltique'] },
  { departamento: 'San Miguel', municipio: 'San Miguel Centro', distritos: ['San Miguel', 'Comacaran', 'Uluazapa', 'Moncagua', 'Quelepa', 'Chirilagua'] },
  { departamento: 'San Miguel', municipio: 'San Miguel Oeste', distritos: ['Chinameca', 'Nueva Guadalupe', 'Lolotique', 'San Jorge', 'San Rafael Oriente', 'El Transito'] },
  { departamento: 'Morazan', municipio: 'Morazan Norte', distritos: ['Arambala', 'Cacaopera', 'Corinto', 'El Rosario', 'Joateca', 'Jocoaitique', 'Meanguera', 'Perquin', 'San Fernando', 'San Isidro', 'Torola'] },
  { departamento: 'Morazan', municipio: 'Morazan Sur', distritos: ['Chilanga', 'Delicias de Concepcion', 'El Divisadero', 'Gualococti', 'Guatajiagua', 'Jocoro', 'Lolotiquillo', 'Osicala', 'San Carlos', 'San Francisco Gotera', 'San Simon', 'Sensembra', 'Sociedad', 'Yamabal', 'Yoloaiquin'] },
  { departamento: 'La Union', municipio: 'La Union Norte', distritos: ['Anamoros', 'Bolivar', 'Concepcion de Oriente', 'El Sauce', 'Lislique', 'Nueva Esparta', 'Poloros', 'San Jose La Fuente'] },
  { departamento: 'La Union', municipio: 'La Union Centro', distritos: ['La Union', 'Conchagua', 'El Carmen', 'Intipuca', 'Meanguera del Golfo', 'San Alejo', 'Yayantique', 'Yucuaiquin'] },
  { departamento: 'La Union', municipio: 'La Union Sur', distritos: ['Pasaquina', 'Santa Rosa de Lima'] },
];

export const departamentosElSalvador = Array.from(
  new Set(ubicacionesElSalvador.map((item) => item.departamento)),
).sort();

export function municipiosPorDepartamento(departamento: string) {
  return ubicacionesElSalvador
    .filter((item) => item.departamento === departamento)
    .map((item) => item.municipio);
}

export function distritosPorMunicipio(departamento: string, municipio: string) {
  return (
    ubicacionesElSalvador.find(
      (item) => item.departamento === departamento && item.municipio === municipio,
    )?.distritos ?? []
  );
}
