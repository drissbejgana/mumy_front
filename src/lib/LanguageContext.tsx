import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { apiFetch } from "./apiClient";

export type Language = "fr" | "en" | "es" | "de" | "pt" | "it";

export interface LanguageInfo {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "it", name: "Italiano", flag: "🇮🇹" }
];

// Rich meaning-by-meaning translation dictionary for full-context translations
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  fr: {}, // Source language, maps directly
  en: {
    // Header & Roles
    "Admin": "Admin",
    "Transporteur": "Carrier",
    "Client Pro": "Pro Client",
    "Chauffeur": "Driver",
    "Modération & IA": "Moderation & AI",
    "ERP & Yield": "ERP & Yield",
    "Hôtels & Riads": "Hotels & Riads",
    "Vue Mobile PWA": "Mobile PWA View",
    "Solde :": "Balance:",
    "Solde : 42 500 DHS": "Balance: 42,500 DHS",
    "Solde": "Balance",
    "Utilisateur": "User",

    // Admin Hub / Super Admin
    "Module de Reversement & FinTech B2B — Super Admin": "Payout & B2B FinTech Module — Super Admin",
    "Contrôlez les flux financiers des circuits touristiques, gerez les IBAN, traitez les commissions de 20%, et débloquez les payouts.": "Control the financial flows of tourist routes, manage IBANs, process 20% commissions, and unlock payouts.",
    "Aperçu Financier": "Financial Overview",
    "Transactions": "Transactions",
    "Transporteurs & KYC": "Carriers & KYC",
    "Ajustements & Litiges": "Adjustments & Disputes",
    "Calendrier de Reversement Bancaire": "Bank Payout Schedule",
    "Hebdomadaire automatique": "Automatic Weekly",
    "Sur demande": "On demand",
    "Seuil minimum de reversement mis à jour": "Minimum payout threshold updated",
    "Seuil minimum enregistré": "Minimum threshold saved",
    "Aucune anomalie de reversement détectée sur le réseau bancaire.": "No payout anomalies detected on the banking network.",
    "Ce document fait office d'accord de facturation tiers et de reversement de commission.": "This document serves as a third-party billing and commission payout agreement.",
    "Reversement Net (80%)": "Net Payout (80%)",
    "Litiges et ajustements post-reversement": "Post-payout disputes and adjustments",
    "Calendrier actuel :": "Current Schedule:",
    "Seuil minimum :": "Min Threshold:",
    "Aucun transporteur n'a dépassé le seuil de reversement de": "No carrier has exceeded the payout threshold of",
    "DHS ou n'a son KYC bancaire validé.": "DHS or has a validated bank KYC.",
    "DHS": "MAD",

    // Client Hub
    "Mes Demandes": "My Requests",
    "Nouvelle Demande": "New Request",
    "Noter la Mission": "Rate the Mission",
    "Évaluer le Chauffeur": "Rate the Driver",
    "Évaluation Double de la Mission": "Double Mission Rating",
    "Partie 1 : Le Chauffeur (Conduite, Accueil)": "Part 1: The Driver (Driving, Hospitality)",
    "Partie 2 : Le Transporteur (Véhicule, Coordination)": "Part 2: The Carrier (Vehicle, Coordination)",
    "Commentaire sur le chauffeur...": "Comment about the driver...",
    "Commentaire sur l'agence / véhicule...": "Comment about the agency / vehicle...",
    "Sécurité anti-abus :": "Anti-abuse security:",
    "Un seul avis par mission. Une fois validée, l'évaluation est modifiable pendant 10 minutes uniquement, après quoi elle sera verrouillée.": "Only one review per mission. Once submitted, the rating is editable for only 10 minutes, after which it will be locked.",
    "Avis finalisé (RGPD / Anti-Abus)": "Review finalized (GDPR / Anti-Abuse)",
    "Modifier l'avis": "Edit review",
    "Modifiable encore pendant": "Modifiable for another",
    "Merci pour votre évaluation séparée ! Ce retour garantit notre charte d'excellence Mumy.": "Thank you for your separate rating! This feedback ensures our Mumy charter of excellence.",
    "Veuillez évaluer votre chauffeur et votre transporteur partenaire.": "Please rate your driver and partner carrier.",
    "Mission terminée. Veuillez évaluer votre chauffeur.": "Mission completed. Please rate your driver.",
    "Aucune demande trouvée.": "No requests found.",
    "Créer un transport": "Create a Transport",
    "Type de véhicule": "Vehicle Type",
    "Lieu de départ": "Departure Location",
    "Lieu d'arrivée": "Arrival Location",
    "Nombre de passagers": "Number of Passengers",
    "Bouton": "Button",
    "Rechercher un transporteur": "Search for a carrier",
    "Offres reçues": "Offers received",
    "Accepter l'offre": "Accept offer",
    "Créer la Demande": "Create Request",
    "Date et Heure": "Date and Time",
    "Rechercher...": "Search...",
    "Filtrer": "Filter",
    "Modifier": "Edit",
    "Supprimer": "Delete",
    "Ajouter": "Add",
    "Valider": "Validate",
    "Annuler": "Cancel",
    "Sauvegarder": "Save",
    "Statut": "Status",
    "Actions": "Actions",
    "Détails": "Details",
    "Sécurité": "Security",
    "Évaluation": "Rating",
    "Commentaire": "Comment",
    "Client": "Client",
    "Prix": "Price",
    "Date": "Date",
    "Destination": "Destination",
    "Départ": "Departure",
    "Arrivée": "Arrival",
    "Passagers": "Passengers",

    // CRM / Transport Hub Tabs
    "CRM & Tableau de bord": "CRM & Dashboard",
    "Flotte": "Fleet",
    "Chauffeurs": "Drivers",
    "ERP & Planification": "ERP & Planning",
    "Finances & Facturation": "Finances & Billing",
    "Pistes de transport": "Transport Leads",
    "Retours à vide": "Empty Returns",
    "Collaboration B2B": "B2B Collaboration",
    "Gestion d'équipe": "Team Management",
    "Constructeur Web": "Web Builder",

    // Common terms
    "En attente": "Pending",
    "Confirmé": "Confirmed",
    "Terminé": "Completed",
    "Annulé": "Cancelled",
    "Payé": "Paid",
    "Litige": "Disputed",
    "En cours": "In Progress",
    "Chauffeur assigné": "Driver assigned",
    "Véhicule assigné": "Vehicle assigned",
    "Aucun chauffeur": "No driver",
    "Aucun véhicule": "No vehicle",
    "Rapport Financier": "Financial Report",
    "Recherche": "Search",
    "Filtrer par": "Filter by",
    "Tous": "All",
    "Toutes": "All",
    "Exporter": "Export",
    "Imprimer": "Print",
    "Configuration": "Settings",
    "Avis Voyageur": "Traveler Review",
    "Avis Signalé :": "Flagged Review:",
    "Signaler cet avis": "Flag this review",
    "Raison du signalement (abus, injure, diffamation, etc.) :": "Reason for flagging (abuse, insult, defamation, etc.):",
    "Avis signalé avec succès ! Le Super Admin examinera votre demande.": "Review successfully flagged! The Super Admin will review your request.",
    "Modifier l'avis...": "Edit review...",
    "Note Chauffeur :": "Driver Rating:",
    "Note Transporteur :": "Carrier Rating:",
    "Note Chauffeur": "Driver Rating",
    "Note Transporteur": "Carrier Rating",
    "Partie 1 : Le Chauffeur": "Part 1: The Driver",
    "Partie 2 : Le Transporteur": "Part 2: The Carrier",
    "Soumettre l'évaluation double": "Submit double evaluation",
    "Fermer": "Close",
    "Chargement...": "Loading...",
    "Succès": "Success",
    "Erreur": "Error",
    "Attention": "Warning",
    "Alerte Gemini :": "Gemini Alert:"
  },
  es: {
    // Header & Roles
    "Admin": "Admin",
    "Transporteur": "Transportista",
    "Client Pro": "Cliente Pro",
    "Chauffeur": "Conductor",
    "Modération & IA": "Moderación e IA",
    "ERP & Yield": "ERP y Yield",
    "Hôtels & Riads": "Hoteles y Riads",
    "Vue Mobile PWA": "Vista Móvil PWA",
    "Solde :": "Saldo:",
    "Solde : 42 500 DHS": "Saldo: 42.500 DHS",
    "Solde": "Saldo",
    "Utilisateur": "Usuario",

    // Admin Hub / Super Admin
    "Module de Reversement & FinTech B2B — Super Admin": "Módulo de Pagos y FinTech B2B — Super Admin",
    "Contrôlez les flux financiers des circuits touristiques, gerez les IBAN, traitez les commissions de 20%, et débloquez les payouts.": "Controle los flujos financieros de las rutas turísticas, gestione los IBAN, procese comisiones del 20% y libere los pagos.",
    "Aperçu Financier": "Resumen Financiero",
    "Transactions": "Transacciones",
    "Transporteurs & KYC": "Transportistas y KYC",
    "Ajustements & Litiges": "Ajustes y Disputas",
    "Calendrier de Reversement Bancaire": "Calendario de Pagos Bancarios",
    "Hebdomadaire automatique": "Semanal automático",
    "Sur demande": "Bajo petición",
    "Seuil minimum de reversement mis à jour": "Umbral mínimo de pago actualizado",
    "Seuil minimum enregistré": "Umbral mínimo guardado",
    "Aucune anomalie de reversement détectée sur le réseau bancaire.": "No se detectaron anomalías de pago en la red bancaria.",
    "Ce document fait office d'accord de facturation tiers et de reversement de commission.": "Este documento sirve como acuerdo de facturación de terceros y pago de comisiones.",
    "Reversement Net (80%)": "Pago Neto (80%)",
    "Litiges et ajustements post-reversement": "Disputas y ajustes post-pago",
    "Calendrier actuel :": "Calendario actual:",
    "Seuil minimum :": "Umbral mínimo:",
    "Aucun transporteur n'a dépassé le seuil de reversement de": "Ningún transportista ha superado el umbral de pago de",
    "DHS ou n'a son KYC bancaire validé.": "DHS o tiene un KYC bancario validado.",
    "DHS": "DHS",

    // Client Hub
    "Mes Demandes": "Mis Solicitudes",
    "Nouvelle Demande": "Nueva Solicitud",
    "Noter la Mission": "Calificar la Misión",
    "Évaluer le Chauffeur": "Calificar al Conductor",
    "Évaluation Double de la Mission": "Evaluación Doble de la Misión",
    "Partie 1 : Le Chauffeur (Conduite, Accueil)": "Parte 1: El Conductor (Conducción, Recepción)",
    "Partie 2 : Le Transporteur (Véhicule, Coordination)": "Parte 2: El Transportista (Vehículo, Coordinación)",
    "Commentaire sur le chauffeur...": "Comentario sobre el conductor...",
    "Commentaire sur l'agence / véhicule...": "Comentario sobre la agencia / vehículo...",
    "Sécurité anti-abus :": "Seguridad anti-abuso:",
    "Un seul avis par mission. Une fois validée, l'évaluation est modifiable pendant 10 minutes uniquement, après quoi elle sera verrouillée.": "Solo una opinión por misión. Una vez validada, la evaluación es modificable durante solo 10 minutos, tras lo cual se bloqueará.",
    "Avis finalisé (RGPD / Anti-Abus)": "Opinión finalizada (RGPD / Anti-Abuso)",
    "Modifier l'avis": "Modificar la opinión",
    "Modifiable encore pendant": "Modificable por otros",
    "Merci pour votre évaluation séparée ! Ce retour garantit notre charte d'excellence Mumy.": "¡Gracias por su evaluación por separado! Este comentario garantiza nuestra carta de excelencia Mumy.",
    "Veuillez évaluer votre chauffeur et votre transporteur partenaire.": "Por favor, califique a su conductor y transportista asociado.",
    "Mission terminée. Veuillez évaluer votre chauffeur.": "Misión completada. Por favor, califique a su conductor.",
    "Aucune demande trouvée.": "No se encontraron solicitudes.",
    "Créer un transport": "Crear un Transporte",
    "Type de véhicule": "Tipo de Vehículo",
    "Lieu de départ": "Lugar de Salida",
    "Lieu d'arrivée": "Lugar de Llegada",
    "Nombre de passagers": "Número de Pasajeros",
    "Bouton": "Botón",
    "Rechercher un transporteur": "Buscar un transportista",
    "Offres reçues": "Ofertas recibidas",
    "Accepter l'offre": "Aceptar oferta",
    "Créer la Demande": "Crear Solicitud",
    "Date et Heure": "Fecha y Hora",
    "Rechercher...": "Buscar...",
    "Filtrer": "Filtrar",
    "Modifier": "Editar",
    "Supprimer": "Eliminar",
    "Ajouter": "Añadir",
    "Valider": "Validar",
    "Annuler": "Cancelar",
    "Sauvegarder": "Guardar",
    "Statut": "Estado",
    "Actions": "Acciones",
    "Détails": "Detalles",
    "Sécurité": "Seguridad",
    "Évaluation": "Evaluación",
    "Commentaire": "Comentario",
    "Client": "Cliente",
    "Prix": "Precio",
    "Date": "Fecha",
    "Destination": "Destino",
    "Départ": "Salida",
    "Arrivée": "Llegada",
    "Passagers": "Pasajeros",

    // CRM / Transport Hub Tabs
    "CRM & Tableau de bord": "CRM y Panel de Control",
    "Flotte": "Flota",
    "Chauffeurs": "Conductores",
    "ERP & Planification": "ERP y Planificación",
    "Finances & Facturation": "Finanzas y Facturación",
    "Pistes de transport": "Clientes potenciales",
    "Retours à vide": "Retornos vacíos",
    "Collaboration B2B": "Colaboración B2B",
    "Gestion d'équipe": "Gestión de Equipos",
    "Constructeur Web": "Creador Web",

    // Common terms
    "En attente": "Pendiente",
    "Confirmé": "Confirmado",
    "Terminé": "Completado",
    "Annulé": "Cancelado",
    "Payé": "Pagado",
    "Litige": "Disputa",
    "En cours": "En curso",
    "Chauffeur assigné": "Conductor asignado",
    "Véhicule assigné": "Vehículo asignado",
    "Aucun chauffeur": "Sin conductor",
    "Aucun véhicule": "Sin vehículo",
    "Rapport Financier": "Informe Financiero",
    "Recherche": "Buscar",
    "Filtrer par": "Filtrar por",
    "Tous": "Todos",
    "Toutes": "Todas",
    "Exporter": "Exportar",
    "Imprimer": "Imprimir",
    "Configuration": "Configuración",
    "Avis Voyageur": "Opinión del Viajero",
    "Avis Signalé :": "Opinión Reportada:",
    "Signaler cet avis": "Reportar esta opinión",
    "Raison du signalement (abus, injure, diffamation, etc.) :": "Razón del reporte (abuso, insulto, difamación, etc.):",
    "Avis signalé avec succès ! Le Super Admin examinera votre demande.": "¡Opinión reportada con éxito! El Super Admin revisará su solicitud.",
    "Modifier l'avis...": "Modificar opinión...",
    "Note Chauffeur :": "Nota Conductor:",
    "Note Transporteur :": "Nota Transportista:",
    "Note Chauffeur": "Nota Conductor",
    "Note Transporteur": "Nota Transportista",
    "Partie 1 : Le Chauffeur": "Parte 1: El Conductor",
    "Partie 2 : Le Transporteur": "Parte 2: El Transportista",
    "Soumettre l'évaluation double": "Enviar evaluación doble",
    "Fermer": "Cerrar",
    "Chargement...": "Cargando...",
    "Succès": "Éxito",
    "Erreur": "Error",
    "Attention": "Atención",
    "Alerte Gemini :": "Alerta de Gemini:"
  },
  de: {
    // Header & Roles
    "Admin": "Admin",
    "Transporteur": "Transporteur",
    "Client Pro": "Pro-Kunde",
    "Chauffeur": "Fahrer",
    "Modération & IA": "Moderation & KI",
    "ERP & Yield": "ERP & Yield",
    "Hôtels & Riads": "Hotels & Riads",
    "Vue Mobile PWA": "Mobile PWA-Ansicht",
    "Solde :": "Guthaben:",
    "Solde : 42 500 DHS": "Guthaben: 42.500 DHS",
    "Solde": "Guthaben",
    "Utilisateur": "Benutzer",

    // Admin Hub / Super Admin
    "Module de Reversement & FinTech B2B — Super Admin": "Auszahlungs- & B2B-FinTech-Modul — Super Admin",
    "Contrôlez les flux financiers des circuits touristiques, gerez les IBAN, traitez les commissions de 20%, et débloquez les payouts.": "Steuern Sie die Finanzströme der Touristenrouten, verwalten Sie IBANs, bearbeiten Sie 20% Provisionen und geben Sie Auszahlungen frei.",
    "Aperçu Financier": "Finanzübersicht",
    "Transactions": "Transaktionen",
    "Transporteurs & KYC": "Transporteure & KYC",
    "Ajustements & Litiges": "Anpassungen & Streitfälle",
    "Calendrier de Reversement Bancaire": "Bank-Auszahlungsplan",
    "Hebdomadaire automatique": "Automatisch wöchentlich",
    "Sur demande": "Auf Anfrage",
    "Seuil minimum de reversement mis à jour": "Mindestauszahlungsschwelle aktualisiert",
    "Seuil minimum enregistré": "Mindestschwelle gespeichert",
    "Aucune anomalie de reversement détectée sur le réseau bancaire.": "Keine Auszahlungsanomalien im Bankennetzwerk festgestellt.",
    "Ce document fait office d'accord de facturation tiers et de reversement de commission.": "Dieses Dokument dient als Vereinbarung für Drittanbieter-Rechnungsstellung und Provisionsauszahlung.",
    "Reversement Net (80%)": "Netto-Auszahlung (80%)",
    "Litiges et ajustements post-reversement": "Streitigkeiten & Anpassungen nach Auszahlung",
    "Calendrier actuel :": "Aktueller Plan:",
    "Seuil minimum :": "Mindestschwelle:",
    "Aucun transporteur n'a dépassé le seuil de reversement de": "Kein Transporteur hat die Auszahlungsschwelle überschritten von",
    "DHS ou n'a son KYC bancaire validé.": "DHS oder hat ein validiertes Bank-KYC.",
    "DHS": "DHS",

    // Client Hub
    "Mes Demandes": "Meine Anfragen",
    "Nouvelle Demande": "Neue Anfrage",
    "Noter la Mission": "Mission bewerten",
    "Évaluer le Chauffeur": "Fahrer bewerten",
    "Évaluation Double de la Mission": "Doppelte Missionsbewertung",
    "Partie 1 : Le Chauffeur (Conduite, Accueil)": "Teil 1: Der Fahrer (Fahrstil, Empfang)",
    "Partie 2 : Le Transporteur (Véhicule, Coordination)": "Teil 2: Der Transporteur (Fahrzeug, Koordination)",
    "Commentaire sur le chauffeur...": "Kommentar zum Fahrer...",
    "Commentaire sur l'agence / véhicule...": "Kommentar zur Agentur / zum Fahrzeug...",
    "Sécurité anti-abus :": "Anti-Missbrauchs-Schutz:",
    "Un seul avis par mission. Une fois validée, l'évaluation est modifiable pendant 10 minutes uniquement, après quoi elle sera verrouillée.": "Nur eine Bewertung pro Mission. Nach dem Absenden kann die Bewertung nur 10 Minuten lang bearbeitet werden, danach wird sie gesperrt.",
    "Avis finalisé (RGPD / Anti-Abus)": "Bewertung abgeschlossen (DSGVO / Anti-Missbrauch)",
    "Modifier l'avis": "Bewertung bearbeiten",
    "Modifiable encore pendant": "Noch bearbeitbar für",
    "Merci pour votre évaluation séparée ! Ce retour garantit notre charte d'excellence Mumy.": "Vielen Dank für Ihre separate Bewertung! Dieses Feedback sichert unsere Mumy-Charta der Exzellenz.",
    "Veuillez évaluer votre chauffeur et votre transporteur partenaire.": "Bitte bewerten Sie Ihren Fahrer und Ihren Partner-Transporteur.",
    "Mission terminée. Veuillez évaluer votre chauffeur.": "Mission abgeschlossen. Bitte bewerten Sie Ihren Fahrer.",
    "Aucune demande trouvée.": "Keine Anfragen gefunden.",
    "Créer un transport": "Transport erstellen",
    "Type de véhicule": "Fahrzeugtyp",
    "Lieu de départ": "Abfahrtsort",
    "Lieu d'arrivée": "Ankunftsort",
    "Nombre de passagers": "Passagieranzahl",
    "Bouton": "Schaltfläche",
    "Rechercher un transporteur": "Transporteur suchen",
    "Offres reçues": "Erhaltene Angebote",
    "Accepter l'offre": "Angebot annehmen",
    "Créer la Demande": "Anfrage erstellen",
    "Date et Heure": "Datum & Uhrzeit",
    "Rechercher...": "Suchen...",
    "Filtrer": "Filtern",
    "Modifier": "Bearbeiten",
    "Supprimer": "Löschen",
    "Ajouter": "Hinzufügen",
    "Valider": "Validieren",
    "Annuler": "Abbrechen",
    "Sauvegarder": "Speichern",
    "Statut": "Status",
    "Actions": "Aktionen",
    "Détails": "Details",
    "Sécurité": "Sicherheit",
    "Évaluation": "Bewertung",
    "Commentaire": "Kommentar",
    "Client": "Kunde",
    "Prix": "Preis",
    "Date": "Datum",
    "Destination": "Zielort",
    "Départ": "Abfahrt",
    "Arrivée": "Ankunft",
    "Passagers": "Passagiere",

    // CRM / Transport Hub Tabs
    "CRM & Tableau de bord": "CRM & Dashboard",
    "Flotte": "Flotte",
    "Chauffeurs": "Fahrer",
    "ERP & Planification": "ERP & Planung",
    "Finances & Facturation": "Finanzen & Abrechnung",
    "Pistes de transport": "Transport-Leads",
    "Retours à vide": "Leerrückfahrten",
    "Collaboration B2B": "B2B-Kooperation",
    "Gestion d'équipe": "Teamverwaltung",
    "Constructeur Web": "Website-Builder",

    // Common terms
    "En attente": "Ausstehend",
    "Confirmé": "Bestätigt",
    "Terminé": "Abgeschlossen",
    "Annulé": "Storniert",
    "Payé": "Bezahlt",
    "Litige": "Streitfall",
    "En cours": "Laufend",
    "Chauffeur assigné": "Fahrer zugewiesen",
    "Véhicule assigné": "Fahrzeug zugewiesen",
    "Aucun chauffeur": "Kein Fahrer",
    "Aucun véhicule": "Kein Fahrzeug",
    "Rapport Financier": "Finanzbericht",
    "Recherche": "Suche",
    "Filtrer par": "Filtern nach",
    "Tous": "Alle",
    "Toutes": "Alle",
    "Exporter": "Exportieren",
    "Imprimer": "Drucken",
    "Configuration": "Einstellungen",
    "Avis Voyageur": "Reisebewertung",
    "Avis Signalé :": "Gemeldete Bewertung:",
    "Signaler cet avis": "Diese Bewertung melden",
    "Raison du signalement (abus, injure, diffamation, etc.) :": "Grund für die Meldung (Missbrauch, Beleidigung, Verleumdung usw.):",
    "Avis signalé avec succès ! Le Super Admin examinera votre demande.": "Bewertung erfolgreich gemeldet! Der Super-Admin wird Ihre Anfrage prüfen.",
    "Modifier l'avis...": "Bewertung bearbeiten...",
    "Note Chauffeur :": "Fahrernote:",
    "Note Transporteur :": "Transporteurnote:",
    "Note Chauffeur": "Fahrernote",
    "Note Transporteur": "Transporteurnote",
    "Partie 1 : Le Chauffeur": "Teil 1: Der Fahrer",
    "Partie 2 : Le Transporteur": "Teil 2: Der Transporteur",
    "Soumettre l'évaluation double": "Doppelbewertung absenden",
    "Fermer": "Schließen",
    "Chargement...": "Wird geladen...",
    "Succès": "Erfolgreich",
    "Erreur": "Fehler",
    "Attention": "Warnung",
    "Alerte Gemini :": "Gemini-Warnung:"
  },
  pt: {
    // Header & Roles
    "Admin": "Admin",
    "Transporteur": "Transportador",
    "Client Pro": "Cliente Pro",
    "Chauffeur": "Motorista",
    "Modération & IA": "Moderação e IA",
    "ERP & Yield": "ERP e Yield",
    "Hôtels & Riads": "Hotéis e Riads",
    "Vue Mobile PWA": "Visualização Móvel PWA",
    "Solde :": "Saldo:",
    "Solde : 42 500 DHS": "Saldo: 42.500 DHS",
    "Solde": "Saldo",
    "Utilisateur": "Usuário",

    // Admin Hub / Super Admin
    "Module de Reversement & FinTech B2B — Super Admin": "Módulo de Pagamentos e FinTech B2B — Super Admin",
    "Contrôlez les flux financiers des circuits touristiques, gerez les IBAN, traitez les commissions de 20%, et débloquez les payouts.": "Controle os fluxos financeiros das rotas turísticas, gerencie IBANs, processe comissões de 20% e libere pagamentos.",
    "Aperçu Financier": "Visão Geral Financeira",
    "Transactions": "Transações",
    "Transporteurs & KYC": "Transportadores e KYC",
    "Ajustements & Litiges": "Ajustes e Litígios",
    "Calendrier de Reversement Bancaire": "Calendário de Pagamentos Bancários",
    "Hebdomadaire automatique": "Semanal automático",
    "Sur demande": "Sob demanda",
    "Seuil minimum de reversement mis à jour": "Limite mínimo de pagamento atualizado",
    "Seuil minimum enregistré": "Limite mínimo salvo",
    "Aucune anomalie de reversement détectée sur le réseau bancaire.": "Nenhuma anomalia de pagamento detectada na rede bancária.",
    "Ce document fait office d'accord de facturation tiers et de reversement de commission.": "Este documento serve como contrato de faturamento de terceiros e pagamento de comissões.",
    "Reversement Net (80%)": "Pagamento Líquido (80%)",
    "Litiges et ajustements post-reversement": "Litígios e ajustes pós-pagamento",
    "Calendrier actuel :": "Calendário atual:",
    "Seuil minimum :": "Limite mínimo:",
    "Aucun transporteur n'a dépassé le seuil de reversement de": "Nenhum transportador excedeu o limite de pagamento de",
    "DHS ou n'a son KYC bancaire validé.": "DHS ou possui um KYC bancário validado.",
    "DHS": "DHS",

    // Client Hub
    "Mes Demandes": "Minhas Solicitações",
    "Nouvelle Demande": "Nova Solicitação",
    "Noter la Mission": "Avaliar a Missão",
    "Évaluer le Chauffeur": "Avaliar o Motorista",
    "Évaluation Double de la Mission": "Avaliação Dupla da Missão",
    "Partie 1 : Le Chauffeur (Conduite, Accueil)": "Parte 1: O Motorista (Condução, Acolhimento)",
    "Partie 2 : Le Transporteur (Véhicule, Coordination)": "Parte 2: O Transportador (Veículo, Coordenação)",
    "Commentaire sur le chauffeur...": "Comentário sobre o motorista...",
    "Commentaire sur l'agence / véhicule...": "Comentário sobre a agência / veículo...",
    "Sécurité anti-abus :": "Segurança anti-abuso:",
    "Un seul avis par mission. Une fois validée, l'évaluation est modifiable pendant 10 minutes uniquement, après quoi elle sera verrouillée.": "Apenas uma avaliação por missão. Uma vez enviada, a avaliação pode ser editada por apenas 10 minutos, após os quais será bloqueada.",
    "Avis finalisé (RGPD / Anti-Abus)": "Avaliação finalizada (RGPD / Anti-Abuso)",
    "Modifier l'avis": "Editar avaliação",
    "Modifiable encore pendant": "Modificável por outros",
    "Merci pour votre évaluation séparée ! Ce retour garantit notre charte d'excellence Mumy.": "Obrigado pela sua avaliação separada! Este feedback garante a nossa carta de excelência Mumy.",
    "Veuillez évaluer votre chauffeur et votre transporteur partenaire.": "Por favor, avalie o seu motorista e o transportador parceiro.",
    "Mission terminée. Veuillez évaluer votre chauffeur.": "Missão concluída. Por favor, avalie o seu motorista.",
    "Aucune demande trouvée.": "Nenhuma solicitação encontrada.",
    "Créer un transport": "Criar um Transporte",
    "Type de véhicule": "Tipo de veículo",
    "Lieu de départ": "Local de Partida",
    "Lieu d'arrivée": "Local de Chegada",
    "Nombre de passagers": "Número de passageiros",
    "Bouton": "Botão",
    "Rechercher un transporteur": "Buscar um transportador",
    "Offres reçues": "Ofertas recebidas",
    "Accepter l'offre": "Aceitar oferta",
    "Créer la Demande": "Criar Solicitação",
    "Date et Heure": "Data e Hora",
    "Rechercher...": "Pesquisar...",
    "Filtrer": "Filtrar",
    "Modifier": "Editar",
    "Supprimer": "Excluir",
    "Ajouter": "Adicionar",
    "Valider": "Validar",
    "Annuler": "Cancelar",
    "Sauvegarder": "Salvar",
    "Statut": "Status",
    "Actions": "Ações",
    "Détails": "Detalhes",
    "Sécurité": "Segurança",
    "Évaluation": "Avaliação",
    "Commentaire": "Comentário",
    "Client": "Cliente",
    "Prix": "Preço",
    "Date": "Data",
    "Destination": "Destino",
    "Départ": "Partida",
    "Arrivée": "Chegada",
    "Passagers": "Passageiros",

    // CRM / Transport Hub Tabs
    "CRM & Tableau de bord": "CRM & Painel de Controle",
    "Flotte": "Frota",
    "Chauffeurs": "Motoristas",
    "ERP & Planification": "ERP & Planejamento",
    "Finances & Facturation": "Finanças & Faturamento",
    "Pistes de transport": "Contatos comerciais",
    "Retours à vide": "Retornos vazios",
    "Collaboration B2B": "Colaboração B2B",
    "Gestion d'équipe": "Gestão de Equipe",
    "Constructeur Web": "Criador de Web",

    // Common terms
    "En attente": "Pendente",
    "Confirmé": "Confirmado",
    "Terminé": "Concluído",
    "Annulé": "Cancelado",
    "Payé": "Pago",
    "Litige": "Litígio",
    "En cours": "Em andamento",
    "Chauffeur assigné": "Motorista atribuído",
    "Véhicule assigné": "Veículo atribuído",
    "Aucun chauffeur": "Sem motorista",
    "Aucun véhicule": "Sem veículo",
    "Rapport Financier": "Relatório Financeiro",
    "Recherche": "Pesquisa",
    "Filtrer par": "Filtrar por",
    "Tous": "Todos",
    "Toutes": "Todas",
    "Exporter": "Exportar",
    "Imprimer": "Imprimir",
    "Configuration": "Configurações",
    "Avis Voyageur": "Avaliação do Viajante",
    "Avis Signalé :": "Avaliação Denunciada:",
    "Signaler cet avis": "Denunciar esta avaliação",
    "Raison du signalement (abus, injure, diffamation, etc.) :": "Razão da denúncia (abuso, insulto, difamação, etc.):",
    "Avis signalé avec succès ! Le Super Admin examinera votre demande.": "Avaliação denunciada com sucesso! O Super Admin analisará o seu pedido.",
    "Modifier l'avis...": "Editar avaliação...",
    "Note Chauffeur :": "Nota Motorista:",
    "Note Transporteur :": "Nota Transportador:",
    "Note Chauffeur": "Nota Motorista",
    "Note Transporteur": "Nota Transportador",
    "Partie 1 : Le Chauffeur": "Parte 1: O Motorista",
    "Partie 2 : Le Transporteur": "Parte 2: O Transportador",
    "Soumettre l'évaluation double": "Enviar avaliação dupla",
    "Fermer": "Fechar",
    "Chargement...": "Carregando...",
    "Succès": "Sucesso",
    "Erreur": "Erro",
    "Attention": "Atenção",
    "Alerte Gemini :": "Alerta Gemini:"
  },
  it: {
    // Header & Roles
    "Admin": "Admin",
    "Transporteur": "Trasportatore",
    "Client Pro": "Cliente Pro",
    "Chauffeur": "Autista",
    "Modération & IA": "Moderazione & IA",
    "ERP & Yield": "ERP & Yield",
    "Hôtels & Riads": "Hotel & Riad",
    "Vue Mobile PWA": "Vista Mobile PWA",
    "Solde :": "Saldo:",
    "Solde : 42 500 DHS": "Saldo: 42.500 DHS",
    "Solde": "Saldo",
    "Utilisateur": "Utente",

    // Admin Hub / Super Admin
    "Module de Reversement & FinTech B2B — Super Admin": "Modulo di Pagamento e FinTech B2B — Super Admin",
    "Contrôlez les flux financiers des circuits touristiques, gerez les IBAN, traitez les commissions de 20%, et débloquez les payouts.": "Controlla i flussi finanziari dei percorsi turistici, gestisci gli IBAN, elabora le commissioni del 20% e sblocca i pagamenti.",
    "Aperçu Financier": "Panoramica Finanziaria",
    "Transactions": "Transazioni",
    "Transporteurs & KYC": "Trasportatori e KYC",
    "Ajustements & Litiges": "Rettifiche & Dispute",
    "Calendrier de Reversement Bancaire": "Calendario dei Pagamenti Bancari",
    "Hebdomadaire automatique": "Settimanale automatico",
    "Sur demande": "Su richiesta",
    "Seuil minimum de reversement mis à jour": "Soglia minima di pagamento aggiornata",
    "Seuil minimum enregistré": "Soglia minima salvata",
    "Aucune anomalie de reversement détectée sur le réseau bancaire.": "Nessuna anomalia di pagamento rilevata sulla rete bancaria.",
    "Ce document fait office d'accord de facturation tiers et de reversement de commission.": "Questo documento funge da accordo di fatturazione di terze parti e pagamento delle commissioni.",
    "Reversement Net (80%)": "Pagamento Netto (80%)",
    "Litiges et ajustements post-reversement": "Dispute e rettifiche post-pagamento",
    "Calendrier actuel :": "Calendario attuale:",
    "Seuil minimum :": "Soglia minima:",
    "Aucun transporteur n'a dépassé le seuil de reversement de": "Nessun trasportatore ha superato la soglia di pagamento di",
    "DHS ou n'a son KYC bancaire validé.": "DHS o ha un KYC bancario convalidato.",
    "DHS": "DHS",

    // Client Hub
    "Mes Demandes": "Le Mie Richieste",
    "Nouvelle Demande": "Nuova Richiesta",
    "Noter la Mission": "Valuta la Missione",
    "Évaluer le Chauffeur": "Valuta l'Autista",
    "Évaluation Double de la Mission": "Doppia Valutazione della Missione",
    "Partie 1 : Le Chauffeur (Conduite, Accueil)": "Parte 1: L'Autista (Guida, Accoglienza)",
    "Partie 2 : Le Transporteur (Véhicule, Coordination)": "Parte 2: Il Trasportatore (Veicolo, Coordinamento)",
    "Commentaire sur le chauffeur...": "Commento sull'autista...",
    "Commentaire sur l'agence / véhicule...": "Commento sull'agenzia / veicolo...",
    "Sécurité anti-abus :": "Sicurezza anti-abuso:",
    "Un seul avis par mission. Une fois validée, l'évaluation est modifiable pendant 10 minutes uniquement, après quoi elle sera verrouillée.": "Solo una recensione per missione. Una volta inviata, la valutazione è modificabile solo per 10 minuti, dopodiché verrà bloccata.",
    "Avis finalisé (RGPD / Anti-Abus)": "Valutazione finalizzata (GDPR / Anti-Abuso)",
    "Modifier l'avis": "Modifica la recensione",
    "Modifiable encore pendant": "Modificabile per altri",
    "Merci pour votre évaluation séparée ! Ce retour garantit notre charte d'excellence Mumy.": "Grazie per la tua valutazione separata! Questo feedback garantisce la nostra carta di eccellenza Mumy.",
    "Veuillez évaluer votre chauffeur et votre transporteur partenaire.": "Si prega di valutare l'autista e il trasportatore partner.",
    "Mission terminée. Veuillez évaluer votre chauffeur.": "Missione completata. Si prega di valutare l'autista.",
    "Aucune demande trouvée.": "Nessuna richiesta trovata.",
    "Créer un transport": "Crea un Trasporto",
    "Type de véhicule": "Tipo di veicolo",
    "Lieu de départ": "Luogo di partenza",
    "Lieu d'arrivée": "Luogo di arrivo",
    "Nombre de passagers": "Numero di passeggeri",
    "Bouton": "Pulsante",
    "Rechercher un transporteur": "Cerca un trasportatore",
    "Offres reçues": "Offerte ricevute",
    "Accepter l'offre": "Accetta l'offerta",
    "Créer la Demande": "Crea Richiesta",
    "Date et Heure": "Data e Ora",
    "Rechercher...": "Cerca...",
    "Filtrer": "Filtra",
    "Modifier": "Modifica",
    "Supprimer": "Elimina",
    "Ajouter": "Aggiungi",
    "Valider": "Convalida",
    "Annuler": "Annulla",
    "Sauvegarder": "Salva",
    "Statut": "Stato",
    "Actions": "Azioni",
    "Détails": "Dettagli",
    "Sécurité": "Sicurezza",
    "Évaluation": "Valutazione",
    "Commentaire": "Commento",
    "Client": "Cliente",
    "Prix": "Prezzo",
    "Date": "Data",
    "Destination": "Destinazione",
    "Départ": "Partenza",
    "Arrivée": "Arrivo",
    "Passagers": "Passeggeri",

    // CRM / Transport Hub Tabs
    "CRM & Tableau de bord": "CRM & Cruscotto",
    "Flotte": "Flotta",
    "Chauffeurs": "Autisti",
    "ERP & Planification": "ERP & Pianificazione",
    "Finances & Facturation": "Finanze & Fatturazione",
    "Pistes de transport": "Contatti commerciali",
    "Retours à vide": "Ritorni a vuoto",
    "Collaboration B2B": "Collaborazione B2B",
    "Gestion d'équipe": "Gestione del Team",
    "Constructeur Web": "Creatore di Siti Web",

    // Common terms
    "En attente": "In attesa",
    "Confirmé": "Confermato",
    "Terminé": "Completato",
    "Annulé": "Annullato",
    "Payé": "Pagato",
    "Litige": "Controversia",
    "En cours": "In corso",
    "Chauffeur assigné": "Autista assegnato",
    "Véhicule assigné": "Veicolo assegnato",
    "Aucun chauffeur": "Nessun autista",
    "Aucun véhicule": "Nessun veicolo",
    "Rapport Financier": "Rapporto Finanziario",
    "Recherche": "Ricerca",
    "Filtrer par": "Filtra per",
    "Tous": "Tutti",
    "Toutes": "Tutte",
    "Exporter": "Esporta",
    "Imprimer": "Stampa",
    "Configuration": "Impostazioni",
    "Avis Voyageur": "Recensione del Viaggiatore",
    "Avis Signalé :": "Recensione Segnalata:",
    "Signaler cet avis": "Segnala questa recensione",
    "Raison du signalement (abus, injure, diffamation, etc.) :": "Motivo della segnalazione (abuso, insulto, diffamazione, ecc.):",
    "Avis signalé avec succès ! Le Super Admin examinera votre demande.": "Recensione segnalata con successo! Il Super Admin esaminerà la tua richiesta.",
    "Modifier l'avis...": "Modifica recensione...",
    "Note Chauffeur :": "Voto Autista:",
    "Note Transporteur :": "Voto Trasportatore:",
    "Note Chauffeur": "Voto Autista",
    "Note Transporteur": "Voto Trasportatore",
    "Partie 1 : Le Chauffeur": "Parte 1: L'Autista",
    "Partie 2 : Le Transporteur": "Parte 2: Il Trasportatore",
    "Soumettre l'évaluation double": "Invia doppia valutazione",
    "Fermer": "Chiudi",
    "Chargement...": "Caricamento...",
    "Succès": "Successo",
    "Erreur": "Errore",
    "Attention": "Attenzione",
    "Alerte Gemini :": "Allerta Gemini:"
  }
};

// Word-by-word/smaller phrase helper dictionary for dynamic segments
const REPLACEMENT_WORDS: Record<Language, Record<string, string>> = {
  fr: {},
  en: {
    "Transfert": "Transfer",
    "Excursion": "Excursion",
    "Navette": "Shuttle",
    "Aller simple": "One way",
    "Aller-Retour": "Round trip",
    "aéroport": "airport",
    "Aéroport": "Airport",
    "Mardi": "Tuesday",
    "Mercredi": "Wednesday",
    "Jeudi": "Thursday",
    "Vendredi": "Friday",
    "Samedi": "Saturday",
    "Dimanche": "Sunday",
    "Lundi": "Monday",
    "Heure": "Hour",
    "Heures": "Hours",
    "Chauffeurs Actifs": "Active Drivers",
    "Véhicules Actifs": "Active Vehicles",
    "Missions en cours": "Active Missions",
    "Taux d'activité": "Activity Rate",
    "DHS/km": "MAD/km",
    "Filtre": "Filter",
    "Tous les chauffeurs": "All drivers",
    "Tous les véhicules": "All vehicles",
    "Ventes": "Sales",
    "Commissions": "Commissions",
    "Revenus": "Revenues",
    "Dernier virement": "Last payout",
    "RIB bancaire": "Bank RIB",
    "Document validé": "Document validated",
    "Approuvé": "Approved",
    "Rejeté": "Rejected",
    "En attente de validation": "Pending validation",
    "B2B Co-voiturage": "B2B Carpooling",
    "Créer une offre": "Create an offer"
  },
  es: {
    "Transfert": "Transferencia",
    "Excursion": "Excursión",
    "Navette": "Lanzadera",
    "Aller simple": "Ida",
    "Aller-Retour": "Ida y vuelta",
    "aéroport": "aeropuerto",
    "Aéroport": "Aeropuerto",
    "Mardi": "Martes",
    "Mercredi": "Miércoles",
    "Jeudi": "Jueves",
    "Vendredi": "Viernes",
    "Samedi": "Sábado",
    "Dimanche": "Domingo",
    "Lundi": "Lunes",
    "Heure": "Hora",
    "Heures": "Horas",
    "Chauffeurs Actifs": "Conductores Activos",
    "Véhicules Actifs": "Vehículos Activos",
    "Missions en cours": "Misiones en Curso",
    "Taux d'activité": "Tasa de Actividad",
    "DHS/km": "DHS/km",
    "Filtre": "Filtro",
    "Tous les chauffeurs": "Todos los conductores",
    "Tous les véhicules": "Todos los vehículos",
    "Ventes": "Ventas",
    "Commissions": "Comisiones",
    "Revenus": "Ingresos",
    "Dernier virement": "Último pago",
    "RIB bancaire": "RIB bancario",
    "Document validé": "Documento validado",
    "Approuvé": "Aprobado",
    "Rejeté": "Rechazado",
    "En attente de validation": "Pendiente de validación",
    "B2B Co-voiturage": "B2B Compartir Coche",
    "Créer une offre": "Crear una oferta"
  },
  de: {
    "Transfert": "Transfer",
    "Excursion": "Ausflug",
    "Navette": "Shuttle",
    "Aller simple": "Einfache Fahrt",
    "Aller-Retour": "Hin- und Rückfahrt",
    "aéroport": "Flughafen",
    "Aéroport": "Flughafen",
    "Mardi": "Dienstag",
    "Mercredi": "Mittwoch",
    "Jeudi": "Donnerstag",
    "Vendredi": "Freitag",
    "Samedi": "Samstag",
    "Dimanche": "Sonntag",
    "Lundi": "Montag",
    "Heure": "Stunde",
    "Heures": "Stunden",
    "Chauffeurs Actifs": "Aktive Fahrer",
    "Véhicules Actifs": "Aktive Fahrzeuge",
    "Missions en cours": "Laufende Missionen",
    "Taux d'activité": "Aktivitätsrate",
    "DHS/km": "DHS/km",
    "Filtre": "Filter",
    "Tous les chauffeurs": "Alle Fahrer",
    "Tous les véhicules": "Alle Fahrzeuge",
    "Ventes": "Verkäufe",
    "Commissions": "Provisionen",
    "Revenus": "Einnahmen",
    "Dernier virement": "Letzte Auszahlung",
    "RIB bancaire": "Bankverbindung (RIB)",
    "Document validé": "Dokument validiert",
    "Approuvé": "Genehmigt",
    "Rejeté": "Abgelehnt",
    "En attente de validation": "Wartet auf Validierung",
    "B2B Co-voiturage": "B2B Fahrgemeinschaft",
    "Créer une offre": "Angebot erstellen"
  },
  pt: {
    "Transfert": "Transferência",
    "Excursion": "Excursão",
    "Navette": "Transbordo",
    "Aller simple": "Só ida",
    "Aller-Retour": "Ida e volta",
    "aéroport": "aeroporto",
    "Aéroport": "Aeroporto",
    "Mardi": "Terça-feira",
    "Mercredi": "Quarta-feira",
    "Jeudi": "Quinta-feira",
    "Vendredi": "Sexta-feira",
    "Samedi": "Sábado",
    "Dimanche": "Domingo",
    "Lundi": "Segunda-feira",
    "Heure": "Hora",
    "Heures": "Horas",
    "Chauffeurs Actifs": "Motoristas Ativos",
    "Véhicules Actifs": "Veículos Ativos",
    "Missions en cours": "Missões em Curso",
    "Taux d'activité": "Taxa de Atividade",
    "DHS/km": "DHS/km",
    "Filtre": "Filtro",
    "Tous les chauffeurs": "Todos os motoristas",
    "Tous les véhicules": "Todos os veículos",
    "Ventes": "Vendas",
    "Commissions": "Comissões",
    "Revenus": "Receitas",
    "Dernier virement": "Último pagamento",
    "RIB bancaire": "RIB bancário",
    "Document validé": "Documento validado",
    "Approuvé": "Aprovado",
    "Rejeté": "Rejeitado",
    "En attente de validation": "Pendente de validação",
    "B2B Co-voiturage": "B2B Carona",
    "Créer une offre": "Criar uma oferta"
  },
  it: {
    "Transfert": "Trasferimento",
    "Excursion": "Escursione",
    "Navette": "Navetta",
    "Aller simple": "Solo andata",
    "Aller-Retour": "Andata e ritorno",
    "aéroport": "aeroporto",
    "Aéroport": "Aeroporto",
    "Mardi": "Martedì",
    "Mercredi": "Mercoledì",
    "Jeudi": "Giovedì",
    "Vendredi": "Venerdì",
    "Samedi": "Sabato",
    "Dimanche": "Domenica",
    "Lundi": "Lunedì",
    "Heure": "Ora",
    "Heures": "Ore",
    "Chauffeurs Actifs": "Autisti Attivi",
    "Véhicules Actifs": "Veicoli Attivi",
    "Missions en cours": "Missioni in Corso",
    "Taux d'activité": "Tasso di Attività",
    "DHS/km": "DHS/km",
    "Filtre": "Filtro",
    "Tous les chauffeurs": "Tutti gli autisti",
    "Tous les véhicules": "Tutti i veicoli",
    "Ventes": "Vendite",
    "Commissions": "Commissioni",
    "Revenus": "Entrate",
    "Dernier virement": "Ultimo pagamento",
    "RIB bancaire": "RIB bancario",
    "Document validé": "Documento convalidato",
    "Approuvé": "Approvato",
    "Rejeté": "Rifiutato",
    "En attente de validation": "In attesa di convalida",
    "B2B Co-voiturage": "B2B Carpooling",
    "Créer une offre": "Crea un'offerta"
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("mumy_language");
    return (saved as Language) || "fr";
  });

  const [dynamicTranslations, setDynamicTranslations] = useState<Record<Language, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem("mumy_dynamic_translations");
      return saved ? JSON.parse(saved) : { fr: {}, en: {}, es: {}, de: {}, pt: {}, it: {} };
    } catch (e) {
      return { fr: {}, en: {}, es: {}, de: {}, pt: {}, it: {} };
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("mumy_language", lang);
    document.documentElement.lang = lang;
  };

  const updateDynamicTranslation = (lang: Language, key: string, val: string) => {
    setDynamicTranslations(prev => {
      const next = {
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [key]: val
        }
      };
      try {
        localStorage.setItem("mumy_dynamic_translations", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const pendingTranslations = useRef<Set<string>>(new Set());

  const fetchTranslation = async (origText: string, targetLang: Language) => {
    const cacheKey = `${targetLang}:${origText}`;
    if (pendingTranslations.current.has(cacheKey)) return;
    pendingTranslations.current.add(cacheKey);

    try {
      const data = await apiFetch<{ translated: string }>("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text: origText, targetLanguage: targetLang })
      });
      if (data.translated) {
        updateDynamicTranslation(targetLang, origText, data.translated);
      }
    } catch (e) {
      console.warn("Translation API error:", e);
    } finally {
      pendingTranslations.current.delete(cacheKey);
    }
  };

  // Safe DOM translation references to avoid memory leaks or endless updates
  const originalTexts = useRef(new WeakMap<Node, string>());
  const originalPlaceholders = useRef(new WeakMap<Element, string>());
  const originalTitles = useRef(new WeakMap<Element, string>());
  const originalAlts = useRef(new WeakMap<Element, string>());
  const originalAriaLabels = useRef(new WeakMap<Element, string>());
  const isTranslating = useRef(false);

  // High-performance translation function
  const t = (text: string): string => {
    if (!text) return "";
    const trimmed = text.trim().replace(/\s+/g, " ");
    if (!trimmed) return text;

    if (language === "fr") return text;

    // 1. Static translations
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[trimmed]) {
      return text.replace(trimmed, langDict[trimmed]);
    }

    // Substring or case-insensitive search
    for (const key of Object.keys(langDict || {})) {
      if (trimmed.toLowerCase() === key.toLowerCase()) {
        return text.replace(trimmed, langDict[key]);
      }
    }

    // 2. Dynamic translations
    const dynamicDict = dynamicTranslations[language];
    if (dynamicDict && dynamicDict[trimmed]) {
      return text.replace(trimmed, dynamicDict[trimmed]);
    }

    // 3. Fallback translation fetching via API
    // Only translate if it has letters and is not purely numbers/symbols
    const hasLetters = /[a-zA-ZÀ-ÿ]/.test(trimmed);
    const isPureNumberOrSymbol = /^[0-9:\s$,.DHS%-+()\/\\#]*$/.test(trimmed);
    if (hasLetters && !isPureNumberOrSymbol) {
      fetchTranslation(trimmed, language);
    }

    // 4. Smart dynamic segment translator (split by numbers or special chars)
    let processed = trimmed;
    const wordDict = REPLACEMENT_WORDS[language];
    if (wordDict) {
      // Translate known word fragments & sub-phrases safely using French-compatible Unicode word boundaries
      for (const [key, replacement] of Object.entries(wordDict) as [string, string][]) {
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(`(?<![a-zA-ZÀ-ÿ0-9_])${escapedKey}(?![a-zA-ZÀ-ÿ0-9_])`, "g");
        processed = processed.replace(regex, replacement);
      }

      // Handle "DHS" and pricing structures (e.g., "1 200 DHS" -> "1 200 MAD" / "1 200 DHS")
      // (language is already known to be non-"fr" here — this function returns early for "fr" above)
      processed = processed.replace(/DHS/g, language === "en" ? "MAD" : "DHS");
      processed = processed.replace(/dhs/g, language === "en" ? "mad" : "dhs");
      processed = processed.replace(/Hôtels/g, TRANSLATIONS[language]["Hôtels & Riads"] ? TRANSLATIONS[language]["Hôtels & Riads"].split(" & ")[0] : "Hotels");
      processed = processed.replace(/Chauffeurs/g, wordDict["Chauffeurs"] || "Drivers");
      processed = processed.replace(/Chauffeur/g, wordDict["Chauffeur"] || "Driver");
      processed = processed.replace(/Véhicules/g, wordDict["Véhicules Actifs"] ? wordDict["Véhicules Actifs"].split(" ")[0] : "Vehicles");
      processed = processed.replace(/Véhicule/g, wordDict["Véhicule"] || "Vehicle");
    }

    return text.replace(trimmed, processed);
  };

  // Translate the DOM nodes using a Walker
  const translateDOM = () => {
    if (isTranslating.current) return;
    isTranslating.current = true;

    try {
      // 1. Walk and translate all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            // Ignore scripts, stylesheets, and textarea/code elements
            const tag = parent.tagName.toLowerCase();
            if (tag === "script" || tag === "style" || tag === "textarea" || tag === "code") {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        const currentVal = node.nodeValue || "";
        if (!currentVal.trim()) continue;

        // Get or store original French text
        let orig = originalTexts.current.get(node);
        if (orig === undefined) {
          orig = currentVal;
          originalTexts.current.set(node, orig);
        } else {
          // If React or another script has dynamically updated the text content,
          // the currentVal won't match either the stored orig or its expected translation.
          // We must treat this new value as the new original French text.
          const expectedTranslation = language === "fr" ? orig : t(orig);
          if (currentVal !== expectedTranslation && currentVal !== orig) {
            orig = currentVal;
            originalTexts.current.set(node, orig);
          }
        }

        if (language === "fr") {
          if (node.nodeValue !== orig) {
            node.nodeValue = orig;
          }
        } else {
          const translated = t(orig);
          if (node.nodeValue !== translated) {
            node.nodeValue = translated;
          }
        }
      }

      // 2. Translate attributes (placeholder, title, alt, aria-label)
      const elementsWithAttributes = document.querySelectorAll("[placeholder], [title], [alt], [aria-label]");
      elementsWithAttributes.forEach((el) => {
        const placeholder = el.getAttribute("placeholder");
        if (placeholder !== null) {
          let origP = originalPlaceholders.current.get(el);
          if (origP === undefined) {
            origP = placeholder;
            originalPlaceholders.current.set(el, origP);
          } else {
            const expectedP = language === "fr" ? origP : t(origP);
            if (placeholder !== expectedP && placeholder !== origP) {
              origP = placeholder;
              originalPlaceholders.current.set(el, origP);
            }
          }

          if (language === "fr") {
            if (el.getAttribute("placeholder") !== origP) {
              el.setAttribute("placeholder", origP);
            }
          } else {
            const translatedP = t(origP);
            if (el.getAttribute("placeholder") !== translatedP) {
              el.setAttribute("placeholder", translatedP);
            }
          }
        }

        const title = el.getAttribute("title");
        if (title !== null) {
          let origT = originalTitles.current.get(el);
          if (origT === undefined) {
            origT = title;
            originalTitles.current.set(el, origT);
          } else {
            const expectedT = language === "fr" ? origT : t(origT);
            if (title !== expectedT && title !== origT) {
              origT = title;
              originalTitles.current.set(el, origT);
            }
          }

          if (language === "fr") {
            if (el.getAttribute("title") !== origT) {
              el.setAttribute("title", origT);
            }
          } else {
            const translatedT = t(origT);
            if (el.getAttribute("title") !== translatedT) {
              el.setAttribute("title", translatedT);
            }
          }
        }

        const alt = el.getAttribute("alt");
        if (alt !== null) {
          let origA = originalAlts.current.get(el);
          if (origA === undefined) {
            origA = alt;
            originalAlts.current.set(el, origA);
          } else {
            const expectedA = language === "fr" ? origA : t(origA);
            if (alt !== expectedA && alt !== origA) {
              origA = alt;
              originalAlts.current.set(el, origA);
            }
          }

          if (language === "fr") {
            if (el.getAttribute("alt") !== origA) {
              el.setAttribute("alt", origA);
            }
          } else {
            const translatedA = t(origA);
            if (el.getAttribute("alt") !== translatedA) {
              el.setAttribute("alt", translatedA);
            }
          }
        }

        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel !== null) {
          let origAL = originalAriaLabels.current.get(el);
          if (origAL === undefined) {
            origAL = ariaLabel;
            originalAriaLabels.current.set(el, origAL);
          } else {
            const expectedAL = language === "fr" ? origAL : t(origAL);
            if (ariaLabel !== expectedAL && ariaLabel !== origAL) {
              origAL = ariaLabel;
              originalAriaLabels.current.set(el, origAL);
            }
          }

          if (language === "fr") {
            if (el.getAttribute("aria-label") !== origAL) {
              el.setAttribute("aria-label", origAL);
            }
          } else {
            const translatedAL = t(origAL);
            if (el.getAttribute("aria-label") !== translatedAL) {
              el.setAttribute("aria-label", translatedAL);
            }
          }
        }
      });
    } catch (e) {
      console.error("Translation walker error:", e);
    } finally {
      isTranslating.current = false;
    }
  };

  // Run initial translation on load and whenever language changes
  useEffect(() => {
    document.documentElement.lang = language;
    translateDOM();

    // Setup MutationObserver to translate dynamically rendered/updated contents immediately
    const observer = new MutationObserver(() => {
      translateDOM();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
}
