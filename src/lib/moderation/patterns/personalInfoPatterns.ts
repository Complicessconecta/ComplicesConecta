/**
 * Patrones regex para detectar información personal sensible
 * Enfocado en datos mexicanos y legales
 */

export const PERSONAL_INFO_PATTERNS = [
  // Tarjetas de crédito (Visa, Mastercard, Amex, Discover)
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/,
  
  // Teléfonos mexicanos (formatos comunes)
  /\b\d{2,3}[-\s]?\d{7,8}\b/, // 55-12345678, 55 12345678, 5512345678
  /\b\+?52[-\s]?\d{2,3}[-\s]?\d{7,8}\b/, // +52 55 12345678
  /\b\(?\d{2,3}\)?[-\s]?\d{7,8}\b/, // (55) 12345678
  
  // CURP (Clave Única de Registro de Población)
  /\b[A-Z]{4}\d{6}[A-Z0-9]{3}\b/,
  
  // RFC (Registro Federal de Contribuyentes)
  /\b[A-Z]{3,4}\d{6}[A-Z0-9]{3}\b/,
  
  // INE/Clave de Elector (18 caracteres)
  /\b[A-Z]{6}\d{8}\d{3}\b/,
  
  // Pasaporte mexicano (formato alfanumérico)
  /\b[A-Z0-9]{9,12}\b/,
  
  // Códigos postales mexicanos (5 dígitos)
  /\b\d{5}\b/,
  
  // Direcciones IP
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/,
  
  // Emails (patrón general)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  
  // Cuentas bancarias (CLABE - 18 dígitos)
  /\b\d{18}\b/,
  
  // Números de seguridad social (IMSS - 11 dígitos)
  /\b\d{11}\b/,
  
  // Licencias de conducir (formato mexicano)
  /\b[A-Z]{2}\d{6}[A-Z0-9]{2}\b/,
  
  // Números de pasaporte (formato internacional)
  /\b[A-Z]{2}\d{7}\b/,
  
  // Códigos de área telefónica mexicana
  /\b(?:55|33|81|656|664|667|669|686|774|775|777|998|999)\b/,
  
  // Patrones de dirección (calle, número, colonia)
  /\b(?:calle|avenida|blvd|boulevard|av\.|c\.|col\.|colonia)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+\s*\d+/i,
  
  // Patrones de coordenadías GPS
  /\b\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b/,
  
  // Patrones de fechas de nacimiento
  /\b(?:0[1-9]|[12]\d|3[01])[-/](?:0[1-9]|1[0-2])[-/]\d{4}\b/,
  /\b\d{4}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])\b/,
  
  // Patrones de RFC con homoclave
  /\b[A-Z]{3,4}\d{6}[A-Z0-9]{3}\b/,
  
  // Patrones de CURP con dígito verificador
  /\b[A-Z]{4}\d{6}[HM][A-Z]{5}\d{2}\b/,
  
  // Patrones de NSS (Número de Seguridad Social)
  /\b\d{11}\b/,
  
  // Patrones de cuenta bancaria (últimos 4 dígitos)
  /\b\*{4,}\d{4}\b/,
  
  // Patrones de tarjeta (últimos 4 dígitos)
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
  /\b\d{4}\s+\*{4,}\s+\d{4}\b/,
  
  // Patrones de teléfono celular (55, 33, 81, etc.)
  /\b(?:55|33|81|656|664|667|669|686|774|775|777|998|999)\d{8}\b/,
  
  // Patrones de WhatsApp
  /\b(?:whatsapp|wa|wsp)[:\s]*\+?\d{2,3}[-\s]?\d{7,8}/i,
  
  // Patrones de Telegram
  /\b(?:telegram|tg)[:\s]*@?[A-Za-z0-9_]{5,}/i,
  
  // Patrones de Instagram
  /\b(?:instagram|ig)[:\s]*@?[A-Za-z0-9_.]{1,30}/i,
  
  // Patrones de Facebook
  /\b(?:facebook|fb)[:\s]*@?[A-Za-z0-9.]{5,}/i,
  
  // Patrones de Twitter/X
  /\b(?:twitter|x)[:\s]*@?[A-Za-z0-9_]{1,15}/i,
  
  // Patrones de TikTok
  /\b(?:tiktok|tt)[:\s]*@?[A-Za-z0-9_.]{2,24}/i,
  
  // Patrones de Snapchat
  /\b(?:snapchat|sc)[:\s]*@?[A-Za-z0-9_.-]{3,15}/i,
  
  // Patrones de LinkedIn
  /\b(?:linkedin|li)[:\s]*@?[A-Za-z0-9-]{5,}/i,
  
  // Patrones de Discord
  /\b(?:discord)[:\s]*@?[A-Za-z0-9_]{1,32}#\d{4}/i,
  
  // Patrones de Skype
  /\b(?:skype)[:\s]*live:[A-Za-z0-9._-]{6,31}/i,
  
  // Patrones de Zoom
  /\b(?:zoom)[:\s]*@?[A-Za-z0-9._-]{6,}/i,
  
  // Patrones de Google Meet
  /\b(?:meet\.google\.com)\/[a-z0-9-]{10,}/i,
  
  // Patrones de Google Drive
  /\b(?:drive\.google\.com)\/(?:file|document|folder)\/[a-zA-Z0-9-_]{20,}/i,
  
  // Patrones de Dropbox
  /\b(?:dropbox\.com)\/(?:s|sh)\/[a-zA-Z0-9-_]{10,}/i,
  
  // Patrones de OneDrive
  /\b(?:onedrive\.live\.com)\/[a-zA-Z0-9-_]{10,}/i,
  
  // Patrones de URL externas
  /\b(?:http|https):\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/,
  
  // Patrones de dominios
  /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/,
  
  // Patrones de subdominios
  /\b(?:[a-zA-Z0-9-]+\.){2,}[a-zA-Z]{2,}\b/,
  
  // Patrones de números de serie
  /\b[A-Z0-9]{8,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{4,}-[A-Z0-9]{12,}\b/,
  
  // Patrones de UUID
  /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/,
  
  // Patrones de IMEI (15 dígitos)
  /\b\d{15}\b/,
  
  // Patrones de ICCID (19-20 dígitos)
  /\b\d{19,20}\b/,
  
  // Patrones de MAC address
  /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/,
  
  // Patrones de número de pasaporte (formato estándar)
  /\b[A-Z]{2}\d{7}\b/,
  
  // Patrones de número de visa
  /\b\d{8,9}\b/,
  
  // Patrones de número de licencia
  /\b[A-Z]{2}\d{6}[A-Z0-9]{2}\b/,
  
  // Patrones de número de seguro
  /\b\d{9,12}\b/,
  
  // Patrones de número de cuenta bancaria
  /\b\d{10,18}\b/,
  
  // Patrones de número de tarjeta
  /\b\d{13,19}\b/,
  
  // Patrones de número de teléfono internacional
  /\b\+?\d{1,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,9}\b/,
  
  // Patrones de código de país
  /\b\+\d{1,3}\b/,
  
  // Patrones de código de área
  /\b\(\d{1,4}\)\b/,
  
  // Patrones de número de fax
  /\b(?:fax|facsímile)[:\s]*\+?\d{1,3}[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,6}\b/i,
  
  // Patrones de número de teléfono de oficina
  /\b(?:oficina|teléfono|tel\.|phone)[:\s]*\+?\d{1,3}[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,6}\b/i,
  
  // Patrones de número de teléfono móvil
  /\b(?:móvil|celular|cel\.|mobile|cell)[:\s]*\+?\d{1,3}[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,6}\b/i,
  
  // Patrones de número de teléfono de casa
  /\b(?:casa|hogar|home)[:\s]*\+?\d{1,3}[-\s]?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{1,6}\b/i,
  
  // Patrones de dirección postal completa
  /\b(?:calle|avenida|blvd|boulevard|av\.|c\.)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+\s*\d+,\s*(?:colonia|col\.|col)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+,\s*(?:c\.p\.|cp|código postal)\s*\d{5}/i,
  
  // Patrones de ciudad y estado
  /\b(?:ciudad|cd\.|cdmx|cd\.mx|estado|edo\.|edo)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de país
  /\b(?:mexico|méxico|mx|méx)\b/i,
  
  // Patrones de código postal con formato
  /\b(?:c\.p\.|cp|código postal)\s*\d{5}/i,
  
  // Patrones de colonia/barrio
  /\b(?:colonia|col\.|col|barrio|col\.|col)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de número de casa/apartamento
  /\b(?:número|no\.|num\.|num|#)\s*\d+[a-zA-Z]?\b/i,
  
  // Patrones de edificio/torre
  /\b(?:edificio|torre|ed\.|tor\.|tor)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\d]+/i,
  
  // Patrones de piso/departamento
  /\b(?:piso|depto|departamento|apt\.|apto)\s*\d+[a-zA-Z]?\b/i,
  
  // Patrones de manzana/lote
  /\b(?:manzana|mza\.|mza|lote|lt\.|lt)\s*\d+/i,
  
  // Patrones de referencia
  /\b(?:referencia|ref\.|ref|entre|frente a|atrás de|cerca de)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de punto de referencia
  /\b(?:punto de referencia|pt\.|pt|referencia|ref\.|ref)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de lugar de encuentro
  /\b(?:lugar|sitio|ubicación|dirección|punto de encuentro|encuentro)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de coordenadías GPS con formato
  /\b(?:lat|latitud|lng|longitud|long)\s*[:=]\s*-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b/i,
  
  // Patrones de mapa
  /\b(?:mapa|google maps|waze|maps\.google\.com)\b/i,
  
  // Patrones de ubicación exacta
  /\b(?:ubicación exacta|dirección exacta|localización exacta)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de geolocalización
  /\b(?:geolocalización|gps|ubicación|localización|coordenadías)\b/i,
  
  // Patrones de código QR
  /\b(?:qr|código qr|qrcode)\b/i,
  
  // Patrones de código de barras
  /\b(?:código de barras|barcode|ean|upc)\b/i,
  
  // Patrones de número de serie de producto
  /\b(?:número de serie|serial|s\.n\.|sn)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de orden
  /\b(?:número de orden|orden|order|ord\.|ord)\s*\d+/i,
  
  // Patrones de número de factura
  /\b(?:número de factura|factura|invoice|fact\.|fact)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de recibo
  /\b(?:número de recibo|recibo|receipt|rec\.|rec)\s*\d+/i,
  
  // Patrones de número de comprobante
  /\b(?:número de comprobante|comprobante|receipt|comp\.|comp)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de transacción
  /\b(?:número de transacción|transacción|transaction|trans\.|trans)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de confirmación
  /\b(?:número de confirmación|confirmación|confirmation|conf\.|conf)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de autorización
  /\b(?:número de autorización|autorización|authorization|auth\.|auth)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de referencia bancaria
  /\b(?:número de referencia|referencia bancaria|bank reference|ref\.|ref)\s*[A-Z0-9-]{8,}/i,
  
  // Patrones de número de CLABE
  /\b(?:clabe|clave bancaria|bank key)\s*\d{18}\b/i,
  
  // Patrones de número de cuenta bancaria
  /\b(?:número de cuenta|cuenta bancaria|bank account|cuenta)\s*\d{10,18}\b/i,
  
  // Patrones de número de tarjeta de crédito
  /\b(?:número de tarjeta|tarjeta de crédito|credit card|tarjeta)\s*(?:\d{4}[-\s]?){3}\d{4}\b/i,
  
  // Patrones de número de tarjeta de débito
  /\b(?:número de tarjeta|tarjeta de débito|debit card|tarjeta)\s*(?:\d{4}[-\s]?){3}\d{4}\b/i,
  
  // Patrones de fecha de expiración de tarjeta
  /\b(?:fecha de expiración|expiración|expiry|exp\.|exp)\s*(?:0[1-9]|1[0-2])\/\d{2,4}\b/i,
  
  // Patrones de CVV/CVC
  /\b(?:cvv|cvc|código de seguridad|security code)\s*\d{3,4}\b/i,
  
  // Patrones de PIN
  /\b(?:pin|código pin|personal identification number)\s*\d{4,6}\b/i,
  
  // Patrones de contraseña
  /\b(?:contraseña|password|pass|pwd|clave)\s*[A-Za-z0-9_!@#$%^&*()+=\-{}[\]|:;"'<>,.?/~`]{8,}/i,
  
  // Patrones de usuario
  /\b(?:usuario|user|username|usr)\s*[A-Za-z0-9_]{3,}/i,
  
  // Patrones de email con formato específico
  /\b[A-Za-z0-9._%+-]+@(?:gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|live\.com|aol\.com|icloud\.com|protonmail\.com|mail\.com)\b/i,
  
  // Patrones de dominio de email
  /\b@(?:gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|live\.com|aol\.com|icloud\.com|protonmail\.com|mail\.com)\b/i,
  
  // Patrones de nombre completo
  /\b[A-Z][a-záéíóúñÁÉÍÓÚÑ]+\s+[A-Z][a-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Z][a-záéíóúñÁÉÍÓÚÑ]+)?\b/,
  
  // Patrones de nombre y apellido
  /\b[A-Z][a-záéíóúñÁÉÍÓÚÑ]+\s+[A-Z][a-záéíóúñÁÉÍÓÚÑ]+\b/,
  
  // Patrones de apellido materno
  /\b[A-Z][a-záéíóúñÁÉÍÓÚÑ]+\s+[A-Z][a-záéíóúñÁÉÍÓÚÑ]+\s+[A-Z][a-záéíóúñÁÉÍÓÚÑ]+\b/,
  
  // Patrones de iniciales
  /\b[A-Z]\.?\s*[A-Z]\.?\s*(?:[A-Z]\.?)?\b/,
  
  // Patrones de nombre con título
  /\b(?:Sr\.|Sra\.|Dr\.|Dra\.|Lic\.|Ing\.|Arq\.|Mtro\.|Mtra\.|Prof\.|Profa\.)\s+[A-Z][a-záéíóúñÁÉÍÓÚÑ]+/i,
  
  // Patrones de firma
  /\b(?:firma|signature|sign)\s*[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de sello
  /\b(?:sello|stamp)\s*[A-Za-z0-9_\-.]+/i,
  
  // Patrones de fecha de nacimiento
  /\b(?:fecha de nacimiento|nacimiento|birth date|dob|fecha nac\.|nac\.|nac)\s*(?:0[1-9]|[12]\d|3[01])[-/](?:0[1-9]|1[0-2])[-/]\d{4}\b/i,
  
  // Patrones de edad
  /\b(?:edad|age)\s*\d{1,3}\s*(?:años|año|years|year|yrs|yr)\b/i,
  
  // Patrones de género
  /\b(?:género|gender|sexo|sex)\s*(?:masculino|femenino|hombre|mujer|male|female|m|f)\b/i,
  
  // Patrones de estado civil
  /\b(?:estado civil|civil status|marital status)\s*(?:soltero|soltera|casado|casada|viudo|viuda|divorciado|divorciada|single|married|widow|divorced)\b/i,
  
  // Patrones de ocupación
  /\b(?:ocupación|ocupación|profession|profesión|job|trabajo)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de nacionalidad
  /\b(?:nacionalidad|nationality)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de lugar de nacimiento
  /\b(?:lugar de nacimiento|birthplace|lugar nac\.|nac\.|nac)\s+[A-Za-záéíóúñÁÉÍÓÚÑ\s]+/i,
  
  // Patrones de fecha de expedición
  /\b(?:fecha de expedición|expedición|issue date|fecha exp\.|exp\.|exp)\s*(?:0[1-9]|[12]\d|3[01])[-/](?:0[1-9]|1[0-2])[-/]\d{4}\b/i,
  
  // Patrones de fecha de vencimiento
  /\b(?:fecha de vencimiento|vencimiento|expiry date|fecha ven\.|ven\.|ven)\s*(?:0[1-9]|[12]\d|3[01])[-/](?:0[1-9]|1[0-2])[-/]\d{4}\b/i,
  
  // Patrones de número de pasaporte con país
  /\b(?:pasaporte|passport)\s*[A-Z]{2}\s*\d{7,12}\b/i,
  
  // Patrones de número de visa con país
  /\b(?:visa)\s*[A-Z]{2}\s*\d{7,12}\b/i,
  
  // Patrones de número de licencia de conducir con estado
  /\b(?:licencia|lic|license)\s*[A-Z]{2}\s*\d{6,12}\b/i,
  
  // Patrones de número de seguro social con país
  /\b(?:seguro social|social security|ssn|nss)\s*[A-Z]{2}?\s*\d{8,12}\b/i,
  
  // Patrones de número de identificación fiscal con país
  /\b(?:identificación fiscal|tax id|rfc|curp|nif)\s*[A-Z]{2}?\s*[A-Z0-9]{8,18}\b/i,
  
  // Patrones de número de identificación personal con país
  /\b(?:identificación personal|personal id|dni|cedula|id)\s*[A-Z]{2}?\s*[A-Z0-9]{6,18}\b/i,
  
  // Patrones de número de registro electoral con país
  /\b(?:registro electoral|electoral roll|ine|clave de elector)\s*[A-Z]{2}?\s*[A-Z0-9]{6,18}\b/i,
  
  // Patrones de número de pasaporte diplomático
  /\b(?:pasaporte diplomático|diplomatic passport)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de pasaporte oficial
  /\b(?:pasaporte oficial|official passport)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de pasaporte ordinario
  /\b(?:pasaporte ordinario|ordinary passport)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de cédula de identidad con país
  /\b(?:cédula de identidad|identity card|cedula|dni)\s*[A-Z]{2}?\s*[A-Z0-9]{6,18}\b/i,
  
  // Patrones de número de documento de identidad con país
  /\b(?:documento de identidad|identity document|documento|doc)\s*[A-Z]{2}?\s*[A-Z0-9]{6,18}\b/i,
  
  // Patrones de número de tarjeta de residencia con país
  /\b(?:tarjeta de residencia|residence card|residencia)\s*[A-Z]{2}?\s*[A-Z0-9]{6,18}\b/i,
  
  // Patrones de número de permiso de trabajo con país
  /\b(?:permiso de trabajo|work permit|permiso)\s*[A-Z]{2}?\s*[A-Z0-9]{6,18}\b/i,
  
  // Patrones de número de visa de trabajo con país
  /\b(?:visa de trabajo|work visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa de estudiante con país
  /\b(?:visa de estudiante|student visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa de turista con país
  /\b(?:visa de turista|tourist visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa de negocios con país
  /\b(?:visa de negocios|business visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa de tránsito con país
  /\b(?:visa de tránsito|transit visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa diplomática con país
  /\b(?:visa diplomática|diplomatic visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa oficial con país
  /\b(?:visa oficial|official visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
  
  // Patrones de número de visa ordinaria con país
  /\b(?:visa ordinaria|ordinary visa)\s*[A-Z]{2}\s*[A-Z0-9]{7,12}\b/i,
];

