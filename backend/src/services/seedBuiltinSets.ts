import { prisma } from '../config/database'

const BUILTIN_SETS = [
  {
    theme: 'builtin_identity',
    name: 'Identité & Présence',
    texts: {
      fr: [
        "Je déclare que cette voix est la mienne. Chaque son que je prononce porte l'empreinte unique de ma gorge, de mes lèvres et de mon souffle. Aucune autre voix ne peut reproduire exactement ces vibrations. Cette signature acoustique m'appartient et témoigne de mon identité à cet instant précis.",
        "Mon prénom résonne différemment selon les langues, mais ma voix reste reconnaissable partout. Les fréquences graves de ma poitrine, les résonances de mon palais et la chaleur de mon timbre forment un ensemble unique. Ni l'imitation ni la technologie ne peuvent parfaitement reproduire ce profil vocal.",
        "Aujourd'hui, je certifie mon identité par la voix. Les voyelles ouvertes, les consonnes sifflantes, les nasales profondes et les occlusives nettes composent ma partition phonétique personnelle. Ce spectre sonore, capturé et analysé, constitue une preuve biométrique fiable et infalsifiable de qui je suis.",
        "La parole est un acte physique autant que mental. Mes muscles laryngés, ma langue, mes dents et mes lèvres coopèrent pour produire chaque phonème. Cette coordination neuromusculaire unique définit mon identité sonore. Je consens librement à cette analyse acoustique destinée à ma certification personnelle.",
        "Chaque être humain possède une voix aussi unique que ses empreintes digitales. La hauteur fondamentale, les formants vocaliques, le débit de parole et les micro-pauses révèlent qui je suis. Cette certification vocale, enregistrée ce jour, servira de référence authentique et légalement reconnue.",
      ],
      en: [
        "I declare that this voice is mine. Every sound I speak carries the unique imprint of my throat, my lips, and my breath. No other voice can reproduce these exact vibrations. This acoustic signature belongs to me and testifies to my identity at this precise moment.",
        "My name resonates differently across languages, but my voice remains recognizable everywhere. The deep frequencies of my chest, the resonances of my palate, and the warmth of my timbre form a unique whole. Neither imitation nor technology can perfectly reproduce this vocal profile.",
        "Today I certify my identity through voice. Open vowels, sibilant consonants, deep nasals, and crisp plosives compose my personal phonetic score. This sound spectrum, captured and analyzed, constitutes a reliable and unfalsifiable biometric proof of who I am.",
        "Speech is a physical act as much as a mental one. My laryngeal muscles, my tongue, my teeth, and my lips cooperate to produce each phoneme. This unique neuromuscular coordination defines my sonic identity. I freely consent to this acoustic analysis intended for my personal certification.",
        "Every human being has a voice as unique as their fingerprints. The fundamental pitch, vowel formants, speech rate, and micro-pauses reveal who I am. This vocal certification, recorded today, will serve as an authentic and legally recognized reference.",
      ],
      es: [
        "Declaro que esta voz es la mía. Cada sonido que pronuncio lleva la huella única de mi garganta, mis labios y mi aliento. Ninguna otra voz puede reproducir exactamente estas vibraciones. Esta firma acústica me pertenece y da fe de mi identidad en este preciso instante.",
        "Mi nombre resuena de manera diferente según los idiomas, pero mi voz sigue siendo reconocible en todas partes. Las frecuencias graves de mi pecho, las resonancias de mi paladar y el calor de mi timbre forman un conjunto único. Ni la imitación ni la tecnología pueden reproducir perfectamente este perfil vocal.",
        "Hoy certifico mi identidad mediante la voz. Las vocales abiertas, las consonantes sibilantes, las nasales profundas y las oclusivas nítidas componen mi partitura fonética personal. Este espectro sonoro, captado y analizado, constituye una prueba biométrica fiable e infalsificable de quién soy.",
        "El habla es un acto físico tanto como mental. Mis músculos laríngeos, mi lengua, mis dientes y mis labios cooperan para producir cada fonema. Esta coordinación neuromuscular única define mi identidad sonora. Consiento libremente este análisis acústico destinado a mi certificación personal.",
        "Cada ser humano posee una voz tan única como sus huellas dactilares. El tono fundamental, los formantes vocálicos, el ritmo del habla y las micro-pausas revelan quién soy. Esta certificación vocal, registrada hoy, servirá como referencia auténtica y legalmente reconocida.",
      ],
    },
  },
  {
    theme: 'builtin_nature',
    name: 'Nature & Éléments',
    texts: {
      fr: [
        "Le vent du nord souffle avec force sur les plaines enneigées. Les arbres dépouillés frémissent sous les rafales glaciales tandis que le ciel gris déverse ses flocons en silence. La nature, dans sa rigueur hivernale, impose un calme profond et une beauté austère que nul artifice ne peut égaler.",
        "La rivière serpente entre les rochers couverts de mousse verte. Son murmure constant accompagne le chant des oiseaux cachés dans les branches touffues. L'eau froide et transparente reflète les nuages qui passent rapidement. Ce paysage paisible invite à la contemplation et au recueillement.",
        "Au lever du soleil, la forêt s'éveille progressivement. Les premiers rayons dorés filtrent entre les feuilles et réchauffent la terre humide. Les rosées scintillent sur les toiles d'araignée tendues entre les herbes hautes. La lumière changeante crée des ombres mouvantes sur le sol tapissé de feuilles mortes.",
        "La mer déchaînée projette ses vagues écumantes contre les falaises grises. Le bruit sourd des flots s'écrase sur la roche résonne au loin. Les mouettes crient en plongeant vers les profondeurs agitées. L'odeur d'iode et de sel marin imprègne l'air frais et vivifiant du bord de mer.",
        "Les volcans endormis gardent en eux une énergie colossale. Leurs pentes douces cachent des chambres magmatiques bouillonnantes prêtes à s'éveiller. La géologie lente et puissante façonne les continents sur des millions d'années. Ces géants de pierre témoignent de la force brute et créatrice de notre planète vivante.",
      ],
      en: [
        "The north wind blows forcefully across the snowy plains. Bare trees shudder under icy gusts while the gray sky drops its snowflakes in silence. Nature, in its winter severity, imposes a deep calm and austere beauty that no artifice can match.",
        "The river winds between rocks covered in green moss. Its constant murmur accompanies the song of birds hidden in leafy branches. The cold, clear water reflects the quickly passing clouds. This peaceful landscape invites contemplation and reflection.",
        "At sunrise, the forest awakens gradually. The first golden rays filter through the leaves and warm the moist earth. Dew sparkles on spider webs stretched between tall grasses. The changing light creates moving shadows on the ground carpeted with dead leaves.",
        "The raging sea hurls its foaming waves against the gray cliffs. The dull roar of waves crashing on the rock echoes in the distance. Seagulls cry as they dive toward the churning depths. The smell of iodine and sea salt permeates the fresh, invigorating air of the shoreline.",
        "Dormant volcanoes hold within them a colossal energy. Their gentle slopes conceal bubbling magma chambers ready to awaken. The slow and powerful geology shapes the continents over millions of years. These stone giants bear witness to the raw, creative force of our living planet.",
      ],
      es: [
        "El viento del norte sopla con fuerza sobre las llanuras nevadas. Los árboles desnudos se estremecen bajo las ráfagas heladas mientras el cielo gris deja caer sus copos en silencio. La naturaleza, en su rigor invernal, impone una calma profunda y una belleza austera que ningún artificio puede igualar.",
        "El río serpentea entre rocas cubiertas de musgo verde. Su murmullo constante acompaña el canto de los pájaros escondidos entre las frondosas ramas. El agua fría y transparente refleja las nubes que pasan rápidamente. Este paisaje apacible invita a la contemplación y al recogimiento.",
        "Al amanecer, el bosque se despierta progresivamente. Los primeros rayos dorados se filtran entre las hojas y calientan la tierra húmeda. El rocío centellea sobre las telarañas tendidas entre las hierbas altas. La luz cambiante crea sombras móviles sobre el suelo alfombrado de hojas muertas.",
        "El mar embravecido lanza sus olas espumosas contra los acantilados grises. El sordo rugido de las olas al estrellarse contra la roca resuena a lo lejos. Las gaviotas chillan al zambullirse hacia las agitadas profundidades. El olor a yodo y sal marina impregna el aire fresco y vivificante de la orilla.",
        "Los volcanes dormidos guardan en su interior una energía colosal. Sus suaves laderas ocultan cámaras magmáticas burbujeantes listas para despertar. La geología lenta y poderosa modela los continentes a lo largo de millones de años. Estos gigantes de piedra atestiguan la fuerza bruta y creativa de nuestro planeta vivo.",
      ],
    },
  },
  {
    theme: 'builtin_daily',
    name: 'Vie quotidienne',
    texts: {
      fr: [
        "Chaque matin, la préparation du petit-déjeuner suit un rituel familier. La cafetière chauffe doucement pendant que le pain grille. L'odeur du café chaud se mêle au parfum des tartines beurrées. Ces instants simples et répétés structurent la journée et offrent un ancrage rassurant dans la routine quotidienne.",
        "Le marché du dimanche réunit commerçants et habitants dans une atmosphère chaleureuse. Les étals colorés regorgent de fruits juteux, de légumes frais et de fromages savoureux. Les conversations animées se croisent entre les allées. Cet espace de partage renforce les liens sociaux et perpétue une tradition ancestrale.",
        "Apprendre une nouvelle langue ouvre des portes insoupçonnées vers d'autres cultures. Les premiers mots étrangers prononcés gauchement deviennent peu à peu naturels. La pratique quotidienne, même brève, consolide les acquis et développe la confiance. La persévérance transforme l'effort initial en plaisir communicatif authentique.",
        "La cuisine est un art qui mêle technique et créativité. Maîtriser les températures, les textures et les associations de saveurs demande patience et pratique. Le coup de feu du service révèle la maîtrise du cuisinier. Un plat réussi procure une satisfaction profonde, partagée généreusement avec les convives.",
        "Le sport collectif enseigne des valeurs essentielles : solidarité, dépassement de soi et respect de l'adversaire. L'entraînement régulier forge le caractère autant que le physique. La victoire comme la défaite offrent des leçons précieuses. L'esprit d'équipe crée des liens durables qui dépassent largement le cadre sportif.",
      ],
      en: [
        "Each morning, preparing breakfast follows a familiar ritual. The coffee maker heats gently while the bread toasts. The smell of hot coffee mingles with the scent of buttered toast. These simple, repeated moments structure the day and offer a reassuring anchor in the daily routine.",
        "The Sunday market brings together merchants and residents in a warm atmosphere. Colorful stalls overflow with juicy fruits, fresh vegetables, and flavorful cheeses. Lively conversations cross between the aisles. This space of sharing strengthens social bonds and perpetuates an ancient tradition.",
        "Learning a new language opens unsuspected doors to other cultures. The first foreign words, clumsily pronounced, gradually become natural. Daily practice, even brief, consolidates knowledge and builds confidence. Perseverance transforms the initial effort into authentic communicative pleasure.",
        "Cooking is an art that blends technique and creativity. Mastering temperatures, textures, and flavor combinations requires patience and practice. The heat of service reveals the cook's skill. A successful dish brings deep satisfaction, generously shared with guests.",
        "Team sports teach essential values: solidarity, self-improvement, and respect for the opponent. Regular training builds character as much as physique. Victory and defeat alike offer valuable lessons. Team spirit creates lasting bonds that extend far beyond the sporting context.",
      ],
      es: [
        "Cada mañana, la preparación del desayuno sigue un ritual familiar. La cafetera se calienta suavemente mientras el pan se tuesta. El olor del café caliente se mezcla con el aroma de las tostadas con mantequilla. Estos instantes sencillos y repetidos estructuran el día y ofrecen un ancla tranquilizadora en la rutina diaria.",
        "El mercado del domingo reúne a comerciantes y vecinos en un ambiente cálido. Los coloridos puestos rebosan de frutas jugosas, verduras frescas y quesos sabrosos. Las animadas conversaciones se cruzan entre los pasillos. Este espacio de convivencia fortalece los lazos sociales y perpetúa una tradición ancestral.",
        "Aprender un nuevo idioma abre puertas insospechadas hacia otras culturas. Las primeras palabras extranjeras, pronunciadas torpemente, se vuelven poco a poco naturales. La práctica diaria, aunque breve, consolida lo aprendido y desarrolla la confianza. La perseverancia transforma el esfuerzo inicial en un auténtico placer comunicativo.",
        "La cocina es un arte que combina técnica y creatividad. Dominar las temperaturas, las texturas y las combinaciones de sabores requiere paciencia y práctica. El fragor del servicio revela la maestría del cocinero. Un plato logrado proporciona una satisfacción profunda, compartida generosamente con los comensales.",
        "El deporte colectivo enseña valores esenciales: solidaridad, superación personal y respeto al adversario. El entrenamiento regular forja el carácter tanto como el físico. La victoria como la derrota ofrecen lecciones valiosas. El espíritu de equipo crea vínculos duraderos que van mucho más allá del ámbito deportivo.",
      ],
    },
  },
  {
    theme: 'builtin_philosophy',
    name: 'Pensée & Philosophie',
    texts: {
      fr: [
        "Le temps est une ressource que nul ne peut acheter ni récupérer. Chaque seconde écoulée appartient définitivement au passé. Cette irréversibilité confère à l'instant présent une valeur inestimable. Vivre pleinement chaque moment, sans se perdre dans les regrets ni dans les projections, constitue une sagesse rare et précieuse.",
        "La confiance se construit lentement, pierre par pierre, et peut s'effondrer en un instant. Elle repose sur la cohérence entre les paroles et les actes. Promettre sans tenir érode irrémédiablement le lien. En revanche, tenir ses engagements, même dans l'adversité, forge une réputation solide et durable.",
        "La curiosité intellectuelle est le moteur de tout progrès humain. Questionner ce que l'on croit savoir, explorer l'inconnu et accepter l'erreur comme source d'apprentissage distingue l'esprit ouvert. Les certitudes figées appauvrissent la pensée. Le doute méthodique, en revanche, ouvre des horizons insoupçonnés et fertilise la créativité.",
        "La liberté n'est pas l'absence de contraintes mais la capacité de choisir comment y répondre. Même dans les situations les plus difficiles, l'être humain conserve une marge de liberté intérieure. Cette autonomie de pensée et de jugement constitue le fondement de la dignité personnelle et de la responsabilité éthique.",
        "Le langage façonne notre perception de la réalité autant qu'il la décrit. Les mots que nous choisissons révèlent nos représentations du monde et influencent nos émotions. Enrichir son vocabulaire, c'est élargir sa capacité de pensée et d'expression. La précision du mot juste confère une force particulière à la communication.",
      ],
      en: [
        "Time is a resource that no one can buy or recover. Every second that passes belongs definitively to the past. This irreversibility gives the present moment an inestimable value. Living each moment fully, without getting lost in regrets or projections, is a rare and precious wisdom.",
        "Trust is built slowly, stone by stone, and can collapse in an instant. It rests on the consistency between words and actions. Promising without delivering irreparably erodes the bond. Conversely, honoring one's commitments, even in adversity, forges a solid and lasting reputation.",
        "Intellectual curiosity is the engine of all human progress. Questioning what one believes to know, exploring the unknown, and accepting error as a source of learning distinguishes the open mind. Fixed certainties impoverish thought. Methodical doubt, however, opens unsuspected horizons and fertilizes creativity.",
        "Freedom is not the absence of constraints but the ability to choose how to respond to them. Even in the most difficult situations, the human being retains a margin of inner freedom. This autonomy of thought and judgment forms the foundation of personal dignity and ethical responsibility.",
        "Language shapes our perception of reality as much as it describes it. The words we choose reveal our representations of the world and influence our emotions. Enriching one's vocabulary is expanding one's capacity for thought and expression. The precision of the right word gives communication a particular force.",
      ],
      es: [
        "El tiempo es un recurso que nadie puede comprar ni recuperar. Cada segundo transcurrido pertenece definitivamente al pasado. Esta irreversibilidad confiere al momento presente un valor inestimable. Vivir plenamente cada instante, sin perderse en lamentos ni en proyecciones, constituye una sabiduría rara y preciosa.",
        "La confianza se construye lentamente, piedra a piedra, y puede derrumbarse en un instante. Se basa en la coherencia entre las palabras y los actos. Prometer sin cumplir erosiona irremediablemente el vínculo. En cambio, cumplir los compromisos, incluso en la adversidad, forja una reputación sólida y duradera.",
        "La curiosidad intelectual es el motor de todo progreso humano. Cuestionar lo que uno cree saber, explorar lo desconocido y aceptar el error como fuente de aprendizaje distingue a la mente abierta. Las certezas fijas empobrecen el pensamiento. La duda metódica, en cambio, abre horizontes insospechados y fertiliza la creatividad.",
        "La libertad no es la ausencia de restricciones sino la capacidad de elegir cómo responder a ellas. Incluso en las situaciones más difíciles, el ser humano conserva un margen de libertad interior. Esta autonomía de pensamiento y juicio constituye el fundamento de la dignidad personal y de la responsabilidad ética.",
        "El lenguaje moldea nuestra percepción de la realidad tanto como la describe. Las palabras que elegimos revelan nuestras representaciones del mundo e influyen en nuestras emociones. Enriquecer el vocabulario es ampliar la capacidad de pensamiento y expresión. La precisión de la palabra justa confiere una fuerza particular a la comunicación.",
      ],
    },
  },
  {
    theme: 'builtin_science',
    name: 'Science & Technologie',
    texts: {
      fr: [
        "Les algorithmes d'intelligence artificielle analysent des millions de données en quelques secondes. Ces systèmes complexes apprennent à reconnaître des schémas invisibles à l'œil humain. La puissance de calcul croissante ouvre des perspectives révolutionnaires en médecine, en climatologie et en ingénierie. L'ère numérique transforme profondément nos sociétés.",
        "La blockchain révolutionne la notion de confiance numérique. Cette technologie distribue l'information sur des milliers de nœuds, rendant toute falsification pratiquement impossible. Les contrats intelligents automatisent les transactions sans intermédiaire. Cette architecture décentralisée redéfinit les concepts de propriété, d'identité et d'authenticité dans l'espace numérique.",
        "L'exploration spatiale repousse les limites de la connaissance humaine. Les sondes envoyées aux confins du système solaire transmettent des données précieuses sur l'origine de l'univers. Les futures missions habitées vers Mars soulèvent des défis technologiques et éthiques considérables. L'humanité projette ses ambitions au-delà des frontières terrestres.",
        "La biométrie vocale exploite les caractéristiques physiques uniques de l'appareil phonatoire. La fréquence fondamentale, les formants, le jitter et le shimmer constituent des paramètres stables dans le temps. Ces marqueurs acoustiques permettent une identification fiable avec un taux d'erreur remarquablement faible dans des conditions d'enregistrement optimales.",
        "Les énergies renouvelables transforment le paysage énergétique mondial. Les panneaux photovoltaïques et les éoliennes produisent désormais une électricité compétitive. Les batteries à haute densité résolvent progressivement le problème de l'intermittence. Cette transition énergétique, nécessaire et urgente, redéfinit les équilibres géopolitiques et économiques du vingt-et-unième siècle.",
      ],
      en: [
        "Artificial intelligence algorithms analyze millions of data points in seconds. These complex systems learn to recognize patterns invisible to the human eye. Growing computing power opens revolutionary prospects in medicine, climatology, and engineering. The digital age is profoundly transforming our societies.",
        "Blockchain revolutionizes the concept of digital trust. This technology distributes information across thousands of nodes, making falsification practically impossible. Smart contracts automate transactions without intermediaries. This decentralized architecture redefines the concepts of ownership, identity, and authenticity in digital space.",
        "Space exploration pushes the boundaries of human knowledge. Probes sent to the edges of the solar system transmit precious data about the origin of the universe. Future crewed missions to Mars raise considerable technological and ethical challenges. Humanity projects its ambitions beyond earthly borders.",
        "Vocal biometrics exploits the unique physical characteristics of the phonatory apparatus. The fundamental frequency, formants, jitter, and shimmer constitute parameters stable over time. These acoustic markers enable reliable identification with a remarkably low error rate under optimal recording conditions.",
        "Renewable energies are transforming the global energy landscape. Photovoltaic panels and wind turbines now produce competitive electricity. High-density batteries are progressively solving the problem of intermittency. This necessary and urgent energy transition is redefining the geopolitical and economic balances of the twenty-first century.",
      ],
      es: [
        "Los algoritmos de inteligencia artificial analizan millones de datos en cuestión de segundos. Estos complejos sistemas aprenden a reconocer patrones invisibles para el ojo humano. El creciente poder de cómputo abre perspectivas revolucionarias en medicina, climatología e ingeniería. La era digital transforma profundamente nuestras sociedades.",
        "La blockchain revoluciona el concepto de confianza digital. Esta tecnología distribuye la información en miles de nodos, haciendo que la falsificación sea prácticamente imposible. Los contratos inteligentes automatizan las transacciones sin intermediarios. Esta arquitectura descentralizada redefine los conceptos de propiedad, identidad y autenticidad en el espacio digital.",
        "La exploración espacial amplía los límites del conocimiento humano. Las sondas enviadas a los confines del sistema solar transmiten datos valiosos sobre el origen del universo. Las futuras misiones tripuladas a Marte plantean considerables desafíos tecnológicos y éticos. La humanidad proyecta sus ambiciones más allá de las fronteras terrestres.",
        "La biometría vocal explota las características físicas únicas del aparato fonatorio. La frecuencia fundamental, los formantes, el jitter y el shimmer constituyen parámetros estables en el tiempo. Estos marcadores acústicos permiten una identificación fiable con una tasa de error notablemente baja en condiciones de grabación óptimas.",
        "Las energías renovables están transformando el panorama energético mundial. Los paneles fotovoltaicos y los aerogeneradores producen ahora electricidad competitiva. Las baterías de alta densidad resuelven progresivamente el problema de la intermitencia. Esta transición energética, necesaria y urgente, redefine los equilibrios geopolíticos y económicos del siglo veintiuno.",
      ],
    },
  },
]

export async function seedBuiltinTextSets() {
  for (const set of BUILTIN_SETS) {
    const existing = await prisma.textSet.findFirst({ where: { theme: set.theme } })
    if (existing) {
      await prisma.textSet.update({
        where: { id: existing.id },
        data: { name: set.name, texts: set.texts, isBuiltin: true, isActive: true },
      })
    } else {
      await prisma.textSet.create({
        data: { name: set.name, theme: set.theme, texts: set.texts, isBuiltin: true, isActive: true },
      })
    }
  }
  console.log('[Seed] Built-in text sets upserted')
}
