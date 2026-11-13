// [nombre, género, plataforma, precio original (COP), % descuento]
const GAMES = [
  ["Marvel's Spider-Man 2","Acción","PS5",249900,40],
  ["Call of Duty: MW III","Shooter","Multi",259900,50],
  ["Forza Horizon 5","Carreras","Xbox / PC",279900,35],
  ["God of War Ragnarök","Acción","PS5",229900,45],
  ["Halo Infinite","Shooter","Xbox / PC",199900,60],
  ["Elden Ring","RPG","Multi",219900,30],
  ["The Witcher 3","RPG","Multi",149900,70],
  ["Cyberpunk 2077","RPG","Multi",189900,55],
  ["Red Dead Redemption 2","Aventura","Multi",199900,50],
  ["Grand Theft Auto V","Acción","Multi",139900,45],
  ["EA Sports FC 25","Deportes","Multi",249900,40],
  ["NBA 2K25","Deportes","Multi",239900,35],
  ["Hogwarts Legacy","RPG","Multi",229900,50],
  ["Zelda: Tears of the Kingdom","Aventura","Switch",259900,20],
  ["Mario Kart 8 Deluxe","Carreras","Switch",239900,15],
  ["Super Mario Odyssey","Aventura","Switch",219900,25],
  ["Hollow Knight","Indie","Multi",59900,40],
  ["Hades","Indie","Multi",79900,50],
  ["Celeste","Indie","Multi",39900,60],
  ["Stardew Valley","Indie","Multi",49900,30],
  ["Resident Evil 4","Terror","Multi",199900,55],
  ["Dead Space","Terror","Multi",189900,60],
  ["Alan Wake 2","Terror","Multi",209900,40],
  ["Silent Hill 2","Terror","PS5 / PC",239900,25],
  ["Civilization VI","Estrategia","PC",129900,75],
  ["Age of Empires IV","Estrategia","PC",149900,50],
  ["Total War: Warhammer III","Estrategia","PC",189900,45],
  ["XCOM 2","Estrategia","Multi",119900,80],
  ["Battlefield 2042","Shooter","Multi",169900,70],
  ["DOOM Eternal","Shooter","Multi",149900,65],
  ["Borderlands 3","Shooter","Multi",139900,70],
  ["Gran Turismo 7","Carreras","PS5",249900,40],
  ["Need for Speed Unbound","Carreras","Multi",219900,60],
  ["F1 24","Carreras","Multi",239900,45],
  ["Assassin's Creed Mirage","Acción","Multi",199900,50],
  ["Ghost of Tsushima","Acción","PS5 / PC",229900,35],
  ["Horizon Forbidden West","Aventura","PS5 / PC",219900,40],
  ["The Last of Us Part I","Aventura","PS5 / PC",259900,30],
  ["Uncharted: Legacy of Thieves","Aventura","PS5 / PC",179900,55],
  ["Baldur's Gate 3","RPG","Multi",239900,15],
  ["Final Fantasy XVI","RPG","PS5",249900,45],
  ["Persona 5 Royal","RPG","Multi",189900,50],
  ["Dark Souls III","RPG","Multi",139900,65],
  ["Sekiro: Shadows Die Twice","Acción","Multi",189900,40],
  ["Street Fighter 6","Acción","Multi",219900,35],
  ["Tekken 8","Acción","Multi",249900,30],
  ["Mortal Kombat 1","Acción","Multi",249900,50],
  ["Minecraft","Aventura","Multi",109900,20],
  ["Cuphead","Indie","Multi",59900,55],
  ["It Takes Two","Aventura","Multi",129900,65]
];

// [nombre, marca, precio original, % descuento, emoji]
const CONSOLES = [
  ["PlayStation 5 Slim","Sony",2499900,10,"🎮"],["PlayStation 5 Pro","Sony",3999900,8,"🎮"],
  ["Xbox Series X","Microsoft",2399900,12,"🎮"],["Xbox Series S","Microsoft",1399900,15,"🎮"],
  ["Nintendo Switch OLED","Nintendo",1599900,10,"🕹️"],["Nintendo Switch Lite","Nintendo",999900,12,"🕹️"],
  ["Steam Deck OLED","Valve",2799900,5,"🕹️"],["ASUS ROG Ally","ASUS",2999900,18,"🕹️"],
  ["Control DualSense","Sony",349900,20,"🎧"],["Meta Quest 3","Meta",2299900,10,"🥽"]
];

// [nombre, juego, precio original, % descuento]
const DLCS = [
  ["Phantom Liberty","Cyberpunk 2077",99900,40],["Shadow of the Erdtree","Elden Ring",109900,25],
  ["Blood and Wine","The Witcher 3",59900,60],["Heart of Stone","The Witcher 3",39900,50],
  ["Burning Shores","Horizon Forbidden West",89900,35],["Rally Adventure","Forza Horizon 5",79900,40],
  ["Hot Wheels","Forza Horizon 5",79900,30],["Pase de temporada","Mortal Kombat 1",129900,45],
  ["Pase de temporada","Street Fighter 6",99900,30],["Ashes of Ariandel","Dark Souls III",69900,50],
  ["Pack Deluxe","Hogwarts Legacy",59900,40],["Pase anual","F1 24",89900,35]
];

// Cuentas de prueba (solo para el proyecto universitario)
const USERS = [
  {email:"carlos.ramirez@gmail.com",  pass:"comprador123", role:"comprador", name:"Carlos Ramírez"},
  {email:"valeria.gomez@outlook.com", pass:"vendedor123",  role:"vendedor",  name:"Valeria Gómez"},
  {email:"andres.londono@hotmail.com",pass:"admin123",     role:"admin",     name:"Andrés Londoño"}
];

// Cupones: "pct" = descuento en toda la compra, "credit" = saldo para comprar. Cada usuario puede usar cada cupón una vez.
const COUPONS = {
  NEXT10:     {type:"pct",    v:10,     desc:"10% de descuento en toda tu compra"},
  LEVELUP25:  {type:"pct",    v:25,     desc:"25% de descuento en toda tu compra"},
  BIENVENIDO: {type:"credit", v:50000,  desc:"$ 50.000 de saldo para comprar"},
  GIFT100:    {type:"credit", v:100000, desc:"$ 100.000 de saldo para comprar"}
};

// Cada cuántos minutos cambian los descuentos al azar (acepta decimales: 0.5 son 30 segundos).
// Al cambiar este número el contador se reinicia y arranca desde el tiempo completo
// (guarda y recarga la página con Ctrl + F5).
const CYCLE_MINUTES = 60;
// true = descuentos al azar, false = se usan los descuentos fijos de las listas de arriba
const RANDOM_DISCOUNTS = true;

// Bonos que se dan al pagar un crédito antes de tiempo (el comprador elige uno)
const BONOS = {Juego:100000, Consola:500000, DLC:30000};

// Descripción corta de cada producto (la llave es el nombre tal como sale en la tienda)
const DESC = {
  "Marvel's Spider-Man 2":"Juega como Peter y Miles en una Nueva York enorme, con combates ágiles y villanos icónicos.",
  "Call of Duty: MW III":"Campaña intensa y multijugador frenético con armas, mapas y modos para jugar en equipo.",
  "Forza Horizon 5":"Carreras de mundo abierto por México con cientos de autos y eventos para todos los gustos.",
  "God of War Ragnarök":"Kratos y Atreus recorren los nueve reinos nórdicos en una épica historia de acción.",
  "Halo Infinite":"El Jefe Maestro vuelve en una campaña de mundo abierto y un multijugador muy competitivo.",
  "Elden Ring":"Explora las Tierras Intermedias en un RPG de mundo abierto exigente y misterioso.",
  "The Witcher 3":"Geralt de Rivia busca a su hija adoptiva en un RPG enorme lleno de decisiones.",
  "Cyberpunk 2077":"Vive en Night City como V, un mercenario en una ciudad futurista de tecnología y corrupción.",
  "Red Dead Redemption 2":"La historia de Arthur Morgan y su banda en el ocaso del viejo oeste, con un mundo muy vivo.",
  "Grand Theft Auto V":"Tres criminales y una ciudad enorme: misiones, atracos y libertad total en Los Santos.",
  "EA Sports FC 25":"Fútbol con equipos y ligas reales, modo carrera y plantillas para armar a tu gusto.",
  "NBA 2K25":"Baloncesto con jugadores reales, modo carrera y partidos en línea.",
  "Hogwarts Legacy":"Estudia magia en Hogwarts, aprende hechizos y explora el mundo mágico a tu manera.",
  "Zelda: Tears of the Kingdom":"Link explora el cielo y las profundidades de Hyrule con poderes para combinar objetos.",
  "Mario Kart 8 Deluxe":"Carreras locas con objetos, pistas coloridas y multijugador para toda la familia.",
  "Super Mario Odyssey":"Mario viaja por reinos muy distintos con su gorra Cappy para rescatar a Peach.",
  "Hollow Knight":"Plataformas y exploración en un reino de insectos, con combates difíciles.",
  "Hades":"Escapa del inframundo griego en un roguelike de acción rápida con historia que avanza en cada intento.",
  "Celeste":"Escala una montaña en un plataformas desafiante con una historia sobre superarse.",
  "Stardew Valley":"Hereda una granja, cultiva, pesca y hazte amigo del pueblo a tu ritmo.",
  "Resident Evil 4":"Leon S. Kennedy rescata a la hija del presidente en un pueblo lleno de peligros.",
  "Dead Space":"Terror espacial: un ingeniero intenta sobrevivir en una nave llena de monstruos.",
  "Alan Wake 2":"Thriller de terror con dos protagonistas y una historia que mezcla realidad y ficción.",
  "Silent Hill 2":"Remake del clásico de terror psicológico, con atmósfera densa y una historia inquietante.",
  "Civilization VI":"Construye un imperio desde la antigüedad y guíalo por la historia con estrategia por turnos.",
  "Age of Empires IV":"Estrategia en tiempo real con civilizaciones medievales, batallas épicas y gestión de recursos.",
  "Total War: Warhammer III":"Dirige ejércitos de distintos reinos en batallas masivas y campañas por turnos.",
  "XCOM 2":"Comanda a la resistencia contra una invasión alienígena en combates tácticos por turnos.",
  "Battlefield 2042":"Grandes batallas con vehículos, jets y muchos jugadores a la vez.",
  "DOOM Eternal":"Dispara y destroza demonios a toda velocidad en un shooter muy dinámico.",
  "Borderlands 3":"Shooter con miles de armas, humor y misiones para jugar con amigos.",
  "Gran Turismo 7":"Simulador de carreras con autos reales, circuitos clásicos y mucha cultura automotriz.",
  "Need for Speed Unbound":"Carreras callejeras con estilo gráfico único, persecuciones y mucho tuning.",
  "F1 24":"Vive la Fórmula 1 con pilotos y equipos oficiales, y un modo carrera completo.",
  "Assassin's Creed Mirage":"Basim, un joven ladrón de Bagdad, se une a los Hermanos Ocultos en una aventura de sigilo.",
  "Ghost of Tsushima":"Un samurái defiende la isla de Tsushima de la invasión mongola en un mundo abierto precioso.",
  "Horizon Forbidden West":"Aloy explora un oeste postapocalíptico lleno de máquinas gigantes.",
  "The Last of Us Part I":"Joel y Ellie cruzan un mundo devastado en una historia emotiva de supervivencia.",
  "Uncharted: Legacy of Thieves":"Nathan Drake y Chloe buscan tesoros en aventuras llenas de acción y humor.",
  "Baldur's Gate 3":"RPG por turnos de Dungeons & Dragons con decisiones que cambian la historia, solo o en cooperativo.",
  "Final Fantasy XVI":"Fantasía oscura con combates de acción, invocaciones gigantes y una historia madura.",
  "Persona 5 Royal":"Estudiantes que de noche roban corazones corruptos: RPG por turnos con vida escolar.",
  "Dark Souls III":"Acción y fantasía oscura en un reino en ruinas, con jefes muy difíciles.",
  "Sekiro: Shadows Die Twice":"Un shinobi busca venganza en el Japón feudal con combates de espada basados en la postura.",
  "Street Fighter 6":"Lucha clásica con personajes icónicos, modo historia y controles para todos los niveles.",
  "Tekken 8":"Peleas 3D intensas con combos espectaculares y rivalidades de toda la saga.",
  "Mortal Kombat 1":"Un universo reiniciado con luchadores clásicos y fatalities más brutales que nunca.",
  "Minecraft":"Construye, explora y sobrevive en un mundo de bloques infinito, solo o con amigos.",
  "Cuphead":"Plataformas y jefes al estilo de los dibujos animados de los años 30, muy desafiante.",
  "It Takes Two":"Aventura cooperativa para dos jugadores sobre una pareja convertida en muñecos.",
  "PlayStation 5 Slim":"Consola de Sony con SSD ultrarrápido y diseño más compacto, para jugar en 4K.",
  "PlayStation 5 Pro":"La PS5 más potente: mejores gráficos, más fluidez y trazado de rayos avanzado.",
  "Xbox Series X":"La consola más potente de Microsoft, con 4K, SSD rápido y compatibilidad con Game Pass.",
  "Xbox Series S":"Versión compacta y más económica de Xbox, ideal para jugar y usar Game Pass.",
  "Nintendo Switch OLED":"Consola híbrida con pantalla OLED de 7 pulgadas para jugar en la TV o donde quieras.",
  "Nintendo Switch Lite":"Versión portátil de Switch, ligera y resistente, pensada para jugar en cualquier lado.",
  "Steam Deck OLED":"PC portátil de Valve con pantalla OLED para llevar tu biblioteca de Steam a todas partes.",
  "ASUS ROG Ally":"Consola portátil con Windows para jugar juegos de PC donde quieras.",
  "Control DualSense":"Mando de PS5 con vibración háptica y gatillos adaptativos que se sienten en cada juego.",
  "Meta Quest 3":"Visor de realidad mixta sin cables para jugar y moverte dentro del juego.",
  "Phantom Liberty · Cyberpunk 2077":"Expansión de espionaje en Dogtown con nuevas misiones, armas y una trama muy intensa.",
  "Shadow of the Erdtree · Elden Ring":"Nueva región, jefes y armas para jugadores que ya terminaron el juego base.",
  "Blood and Wine · The Witcher 3":"Geralt viaja a Toussaint, una región de viñedos, con una gran historia nueva.",
  "Heart of Stone · The Witcher 3":"Misión de misterio con un trato sobrenatural y personajes nuevos.",
  "Burning Shores · Horizon Forbidden West":"Aloy llega a un Los Ángeles en ruinas con nuevos enemigos y un compañero inesperado.",
  "Rally Adventure · Forza Horizon 5":"Nuevas carreras de rally, autos y rutas de lodo por México.",
  "Hot Wheels · Forza Horizon 5":"Pistas imposibles inspiradas en los carritos Hot Wheels y autos de colección.",
  "Pase de temporada · Mortal Kombat 1":"Acceso a luchadores nuevos y paquetes extra durante la temporada.",
  "Pase de temporada · Street Fighter 6":"Personajes adicionales y trajes para ampliar tu plantilla de peleadores.",
  "Ashes of Ariandel · Dark Souls III":"Nueva zona nevada con jefes, armas y secretos por descubrir.",
  "Pack Deluxe · Hogwarts Legacy":"Contenido extra para tu personaje: monturas, cosméticos y más.",
  "Pase anual · F1 24":"Contenidos y mejoras adicionales para vivir toda la temporada."
};
