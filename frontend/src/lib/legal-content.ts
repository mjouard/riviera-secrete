/**
 * Contenu des pages légales, en clair plutôt qu'éclaté dans `messages/*.json`.
 *
 * Même parti pris que `/credits` : de la prose longue et rarement modifiée se relit mieux
 * d'un bloc, et un texte juridique doit pouvoir être comparé phrase à phrase entre les deux
 * langues. La version **française fait foi** ; l'anglaise est une traduction de confort.
 *
 * ⚠️ `A_COMPLETER` marque ce que seul l'éditeur du site peut renseigner (identité, contact).
 * Ces champs sont affichés tels quels, en évidence, plutôt que remplis avec une valeur
 * plausible : une mention légale inventée serait pire que pas de mention du tout.
 */

export const A_COMPLETER = "[À compléter]";

export interface Bloc {
  titre: string;
  paragraphes?: string[];
  /** Liste à puces, affichée sous les paragraphes. */
  puces?: string[];
  /** Tableau simple : en-têtes puis lignes. */
  tableau?: { entetes: string[]; lignes: string[][] };
}

type Contenu = { intro: string; maj: string; blocs: Bloc[] };

const MENTIONS_FR: Contenu = {
  intro:
    "Informations légales relatives au site Riviera Secrète, conformément à la loi pour la confiance dans l'économie numérique (LCEN).",
  maj: "Dernière mise à jour : 14 septembre 2026.",
  blocs: [
    {
      titre: "Éditeur du site",
      paragraphes: [
        `Riviera Secrète est un projet éditorial indépendant, sans société d'exploitation ni activité commerciale : le site ne vend rien, n'affiche aucune publicité et ne perçoit aucune commission d'affiliation sur les liens de réservation qu'il propose.`,
        `Éditeur et directeur de la publication : ${A_COMPLETER}.`,
        `Contact : ${A_COMPLETER}.`,
      ],
    },
    {
      titre: "Hébergement",
      paragraphes: [
        "Le site (pages et images) est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.",
        "L'API et la base de données sont hébergées par Railway Corporation, 80 Wilson Ave, San Francisco, CA 94107, États-Unis — railway.com.",
      ],
    },
    {
      titre: "Propriété intellectuelle",
      paragraphes: [
        "Les textes et la sélection éditoriale des lieux sont l'œuvre de l'éditeur.",
        "Les photographies proviennent en grande partie de Wikimedia Commons et sont diffusées sous licences Creative Commons (CC BY, CC BY-SA) ou dans le domaine public. Chaque photo est créditée nominativement sur la page Crédits photo, comme ces licences l'exigent.",
      ],
    },
    {
      titre: "Liens sortants et exactitude des informations",
      paragraphes: [
        "Le site renvoie vers des sites tiers (réservation, billetterie, offices de tourisme) sur lesquels l'éditeur n'a aucun contrôle et dont il ne peut garantir le contenu.",
        "Les horaires, tarifs et conditions d'accès sont donnés à titre indicatif et vieillissent : ils sont vérifiés au moment de l'écriture, pas en continu. Vérifiez toujours auprès de l'établissement avant de vous déplacer.",
      ],
    },
    {
      titre: "Signaler une erreur",
      paragraphes: [
        `Une information périmée, un lieu fermé, une photo mal créditée : ${A_COMPLETER}.`,
      ],
    },
  ],
};

const MENTIONS_EN: Contenu = {
  intro:
    "Legal information about the Riviera Secrète website, as required by French law (LCEN). The French version is the authoritative one.",
  maj: "Last updated: 14 September 2026.",
  blocs: [
    {
      titre: "Publisher",
      paragraphes: [
        "Riviera Secrète is an independent editorial project with no operating company and no commercial activity: the site sells nothing, shows no advertising and earns no affiliate commission on the booking links it lists.",
        `Publisher and editorial director: ${A_COMPLETER}.`,
        `Contact: ${A_COMPLETER}.`,
      ],
    },
    {
      titre: "Hosting",
      paragraphes: [
        "The site (pages and images) is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA — vercel.com.",
        "The API and database are hosted by Railway Corporation, 80 Wilson Ave, San Francisco, CA 94107, USA — railway.com.",
      ],
    },
    {
      titre: "Intellectual property",
      paragraphes: [
        "The texts and the editorial selection of places are the publisher's own work.",
        "Most photographs come from Wikimedia Commons and are published under Creative Commons licences (CC BY, CC BY-SA) or in the public domain. Every photo is credited by name on the Photo credits page, as those licences require.",
      ],
    },
    {
      titre: "Outbound links and accuracy",
      paragraphes: [
        "The site links to third-party websites (booking, ticketing, tourist offices) over which the publisher has no control and whose content it cannot guarantee.",
        "Opening hours, prices and access conditions are indicative and do age: they are checked when written, not continuously. Always confirm with the venue before travelling.",
      ],
    },
    {
      titre: "Report an error",
      paragraphes: [
        `Outdated information, a closed venue, a miscredited photo: ${A_COMPLETER}.`,
      ],
    },
  ],
};

const CONFIDENTIALITE_FR: Contenu = {
  intro:
    "Cette page explique quelles données Riviera Secrète collecte, pourquoi, et ce que vous pouvez exiger à leur sujet. Le site fonctionne entièrement sans compte : la création d'un compte ne sert qu'à retrouver vos favoris et vos itinéraires d'un appareil à l'autre.",
  maj: "Dernière mise à jour : 14 septembre 2026.",
  blocs: [
    {
      titre: "Responsable du traitement",
      paragraphes: [`${A_COMPLETER}. Pour toute demande relative à vos données : ${A_COMPLETER}.`],
    },
    {
      titre: "Données collectées et pourquoi",
      tableau: {
        entetes: ["Donnée", "Quand", "Pourquoi", "Base légale"],
        lignes: [
          ["Adresse e-mail, prénom", "Création d'un compte", "Identifier le compte, envoyer l'e-mail de confirmation", "Exécution du service demandé"],
          ["Mot de passe (empreinte BCrypt, jamais en clair)", "Inscription par e-mail", "Vous authentifier", "Exécution du service demandé"],
          ["Identifiant Google", "Connexion via Google", "Rattacher la connexion Google à votre compte", "Exécution du service demandé"],
          ["Favoris, itinéraires enregistrés", "Quand vous les créez", "Vous les restituer", "Exécution du service demandé"],
          ["Adresse IP", "À chaque appel aux pages de connexion", "Limiter les tentatives automatisées", "Intérêt légitime (sécurité)"],
          ["Statistiques de fréquentation anonymes", "À chaque visite", "Mesurer l'audience", "Intérêt légitime (mesure d'audience sans cookie)"],
        ],
      },
      paragraphes: [
        "Aucune donnée n'est vendue, louée, ni transmise à des fins publicitaires. Le site ne pratique aucun profilage et ne prend aucune décision automatisée vous concernant.",
      ],
    },
    {
      titre: "Votre position n'est jamais transmise",
      paragraphes: [
        "Le bouton « Près de moi » utilise la géolocalisation de votre navigateur, qui vous demande votre accord. Les coordonnées obtenues servent uniquement à trier la liste dans votre navigateur : elles ne sont ni envoyées au serveur, ni enregistrées, ni conservées après la fermeture de l'onglet.",
      ],
    },
    {
      titre: "Cookies et stockage local",
      paragraphes: [
        "Aucun cookie publicitaire ni traceur tiers. Le site n'affiche pas de bandeau de consentement parce qu'il n'utilise que des cookies strictement nécessaires, qui en sont dispensés.",
      ],
      puces: [
        "Cookie de session : déposé uniquement si vous vous connectez, pour vous maintenir connecté (30 jours).",
        "Cookie de langue : mémorise votre choix entre le français et l'anglais.",
        "Stockage de session : conserve un itinéraire en cours de composition le temps que vous vous connectiez pour l'enregistrer. Effacé à la fermeture de l'onglet.",
        "Cache hors ligne : les pages, images et fonds de carte que vous consultez sont copiés dans votre navigateur pour que le site reste consultable sans réseau. Ce cache ne quitte jamais votre appareil et se vide depuis les réglages de votre navigateur.",
        "Mesure d'audience Plausible : sans cookie, sans identifiant persistant, sans donnée personnelle.",
      ],
    },
    {
      titre: "Qui d'autre y a accès",
      paragraphes: [
        "Les prestataires techniques strictement nécessaires au fonctionnement du site, chacun agissant comme sous-traitant :",
      ],
      puces: [
        "Vercel Inc. (États-Unis) — hébergement du site.",
        "Railway Corporation (États-Unis) — hébergement de l'API et de la base de données.",
        "Resend (États-Unis) — envoi des e-mails de confirmation d'adresse.",
        "Google Ireland Ltd. — uniquement si vous choisissez la connexion Google.",
        "Plausible Analytics (Union européenne) — mesure d'audience anonyme.",
      ],
    },
    {
      titre: "Combien de temps",
      puces: [
        "Compte, favoris et itinéraires : conservés tant que le compte existe, supprimés sur demande.",
        "Jeton de confirmation d'adresse : 24 heures, puis effacé.",
        "Adresses IP du dispositif anti-abus : gardées en mémoire vive quelques minutes, jamais enregistrées en base.",
        "Statistiques d'audience : agrégées, sans donnée individuelle.",
      ],
    },
    {
      titre: "Vos droits",
      paragraphes: [
        "Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition sur vos données. La suppression de votre compte entraîne celle de vos favoris et de vos itinéraires.",
        `Pour exercer ces droits : ${A_COMPLETER}. Si la réponse ne vous satisfait pas, vous pouvez saisir la CNIL (cnil.fr), 3 place de Fontenoy, 75007 Paris.`,
      ],
    },
  ],
};

const CONFIDENTIALITE_EN: Contenu = {
  intro:
    "This page explains what data Riviera Secrète collects, why, and what you can require about it. The site works entirely without an account: creating one only lets you find your favourites and itineraries again from another device. The French version is the authoritative one.",
  maj: "Last updated: 14 September 2026.",
  blocs: [
    {
      titre: "Data controller",
      paragraphes: [`${A_COMPLETER}. For any request about your data: ${A_COMPLETER}.`],
    },
    {
      titre: "What is collected and why",
      tableau: {
        entetes: ["Data", "When", "Why", "Legal basis"],
        lignes: [
          ["Email address, first name", "Creating an account", "Identify the account, send the confirmation email", "Performance of the requested service"],
          ["Password (BCrypt hash, never in clear text)", "Email sign-up", "Authenticate you", "Performance of the requested service"],
          ["Google identifier", "Signing in with Google", "Link your Google sign-in to your account", "Performance of the requested service"],
          ["Favourites, saved itineraries", "When you create them", "Give them back to you", "Performance of the requested service"],
          ["IP address", "On every call to the sign-in endpoints", "Limit automated attempts", "Legitimate interest (security)"],
          ["Anonymous traffic statistics", "On every visit", "Measure audience", "Legitimate interest (cookieless analytics)"],
        ],
      },
      paragraphes: [
        "No data is sold, rented or passed on for advertising. The site does no profiling and makes no automated decisions about you.",
      ],
    },
    {
      titre: "Your location is never sent anywhere",
      paragraphes: [
        "The “Near me” button uses your browser's geolocation, which asks for your permission. The coordinates are used only to sort the list inside your browser: they are never sent to the server, never stored, and not kept once you close the tab.",
      ],
    },
    {
      titre: "Cookies and local storage",
      paragraphes: [
        "No advertising cookies, no third-party trackers. The site shows no consent banner because it only uses strictly necessary cookies, which are exempt.",
      ],
      puces: [
        "Session cookie: set only if you sign in, to keep you signed in (30 days).",
        "Language cookie: remembers your choice between French and English.",
        "Session storage: keeps an itinerary you are composing while you sign in to save it. Cleared when you close the tab.",
        "Offline cache: the pages, images and map tiles you view are copied into your browser so the site stays readable without a connection. This cache never leaves your device and can be cleared from your browser settings.",
        "Plausible analytics: no cookie, no persistent identifier, no personal data.",
      ],
    },
    {
      titre: "Who else has access",
      paragraphes: [
        "Only the technical providers strictly needed to run the site, each acting as a processor:",
      ],
      puces: [
        "Vercel Inc. (USA) — website hosting.",
        "Railway Corporation (USA) — API and database hosting.",
        "Resend (USA) — sending address-confirmation emails.",
        "Google Ireland Ltd. — only if you choose to sign in with Google.",
        "Plausible Analytics (European Union) — anonymous analytics.",
      ],
    },
    {
      titre: "How long",
      puces: [
        "Account, favourites and itineraries: kept while the account exists, deleted on request.",
        "Address-confirmation token: 24 hours, then erased.",
        "IP addresses used for abuse protection: held in memory for a few minutes, never written to the database.",
        "Audience statistics: aggregated, with no individual data.",
      ],
    },
    {
      titre: "Your rights",
      paragraphes: [
        "You have the right to access, rectify, erase, port, restrict and object to the processing of your data. Deleting your account also deletes your favourites and itineraries.",
        `To exercise these rights: ${A_COMPLETER}. If the answer does not satisfy you, you may lodge a complaint with the CNIL (cnil.fr), 3 place de Fontenoy, 75007 Paris, France.`,
      ],
    },
  ],
};

export function mentionsLegales(locale: string): Contenu {
  return locale === "en" ? MENTIONS_EN : MENTIONS_FR;
}

export function politiqueConfidentialite(locale: string): Contenu {
  return locale === "en" ? CONFIDENTIALITE_EN : CONFIDENTIALITE_FR;
}
