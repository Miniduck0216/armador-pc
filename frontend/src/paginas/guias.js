import { montar } from '../js/layout.js';
import { api } from '../js/api.js';
import { $, cargando, errorEn } from '../js/util.js';
import { tarjetaGuia } from '../js/tarjetas.js';

montar('guias');
cargando($('#lista'), 3, 360);
api('/guias')
  .then((g) => ($('#lista').innerHTML = g.map(tarjetaGuia).join('')))
  .catch((e) => errorEn($('#lista'), e));
