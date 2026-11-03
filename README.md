# Conterosso Social Club — piattaforma associativa

Prima implementazione Next.js/TypeScript per sito pubblico, calendario, prenotazioni individuali e di gruppo, cicli, lista d’attesa, tesseramento e gestionale. **Versione di sviluppo: non pubblicata, integrazioni reali non collaudate.**

## Avvio locale

Richiede Node.js 22 o successivo.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Aprire http://localhost:3000. `APP_MODE=demo` usa esclusivamente `.data/demo.json`: account e attività sono sintetici, email e pagamenti reali non vengono inviati. La pagina di accesso mostra gli account di prova; OTP demo `12345678`. Non esporre la modalità demo a dati personali reali.

```sh
npm test
npm run typecheck
npm run build
```

## Funzioni implementate

- Pagine pubbliche, calendario filtrabile, archivio storico con fonti, contatti e contenuti modificabili.
- Accesso email + codice fiscale + OTP numerico a 8 cifre. Nessuna password; CF usato come identificatore. Sessione HttpOnly; TOTP aggiuntivo obbligatorio per operatori in modalità reale.
- Gruppi senza conferme parziali, prezzi calcolati sul server, prenotazioni di un incontro o dell’intero ciclo, capienza atomica, idempotenza.
- Lista d’attesa con regola da configurare: ordine stretto oppure primo gruppo compatibile. Nessuna assegnazione automatica finché la regola è indefinita.
- Amministratore, responsabile di attività e utente; controlli server, incassi parziali, presenze subordinate a tessera e saldo.
- Registro contabile, import soci XLSX con anteprima e conferma, esportazioni, audit.
- Coda notifiche persistente, promemoria operatori T−5h e utenti T−2h. Invio email/WhatsApp e webhook predisposti; stato accettato distinto da consegnato.
- Stripe Checkout, webhook firmato e riconciliazione predisposti.

## Attivazione Firebase e servizi

1. Usare un ambiente di staging separato, impostare `APP_MODE=firebase`, `APP_URL` HTTPS e le variabili Firebase di `.env.example`.
2. Configurare Application Default Credentials **sul server** con identità di servizio limitata al progetto. La configurazione web fornita non concede accesso amministrativo. Non inviare chiavi private in chat o nel repository.
3. Abilitare Firebase Authentication per le sessioni custom; distribuire `database.rules.json` sul progetto corretto. Le regole negano accesso diretto client: tutte le operazioni passano dal server Admin SDK.
4. Generare due segreti indipendenti di almeno 32 caratteri per `AUTH_SECRET` e `DATA_ENCRYPTION_KEY`, conservarli nel secret manager e predisporre backup. Cambiare queste chiavi senza migrazione rende identità/cifrati incompatibili.
5. Configurare Resend e mittente verificato. Webhook `/api/webhooks/email`; segreto Svix nella variabile dedicata. Collaudare OTP, scadenza, tentativi e recupero account.
6. Predisporre primo amministratore e segreto TOTP mediante `node --env-file=.env.local --import tsx scripts/provision-admin.ts`, fornendo il JSON descritto nello script tramite stdin in ambiente fidato; il provisioning e il recupero MFA non hanno ancora una UI. Gli account reali non sono creati automaticamente dai dati demo.
7. Se richiesti, configurare Stripe e webhook `/api/webhooks/stripe`, WhatsApp Business e template approvato con relativo webhook. Verificare tutti i servizi in sandbox prima dell’uso reale.
8. Configurare un job server periodico che esegua POST `/api/jobs/run` con `Authorization: Bearer <CRON_SECRET>`. La coda non si esegue autonomamente senza scheduler.
9. Confermare quota, validità tessera, procedura associativa, cancellazioni/rimborsi, deleghe e lista d’attesa nel gestionale; completare privacy e condizioni prima della raccolta dati.

## Limiti e verifiche ancora necessarie

I test automatici coprono il dominio locale, **non** Firebase o provider reali. Servono emulatori/test concorrenti RTDB, verifiche di sicurezza e collaudo completo su dispositivi mobili. Le transazioni usano l’aggregato `/club`: semplice e consistente per il primo impianto, da suddividere e sottoporre a test di carico prima di una crescita significativa. Nessuna scalabilità illimitata dichiarata.

Da completare prima della produzione: collaudo provisioning e recupero amministratore/MFA, riconciliazione rimborsi pendenti e pagamenti multipli anomali, associazione assistita di account a persone già importate, rettifica partecipanti, documentazione fiscale, politiche conservazione/cancellazione dati, limiti richieste al reverse proxy, protezione import da archivi XLSX malevoli, test accessibilità e fusi orari editor eventi. L’editor attuale indica esplicitamente UTC per evitare conversioni implicite. Import: nuovi soci in verifica, senza attivare automaticamente tessere o incassi.

Nessun logo ufficiale o fotografia è stato inventato: il marchio tipografico e le grafiche sono proposte originali. Gli appuntamenti demo non sono eventi reali.

## Fonti contenuti

Pagina Facebook indicata dall’utente: https://www.facebook.com/p/Conterosso-Social-Club-61566867993854/ . La lettura diretta dei post è risultata limitata. I contenuti storici sono pertanto accompagnati da fonti pubbliche di riscontro:

- https://iltaccodibacco.it/molfetta/conterosso-social-club-aps-ats
- https://iltaccodibacco.it/puglia/eventi/305216.html
- https://www.quindici-molfetta.it/centri-di-gravita-temporanei-orbita-03-attraversa-la-memoria-di-molfetta_62228.aspx
- https://www.molfettaviva.it/notizie/a-molfetta-arriva-la-mostra-museum-l-arte-di-osservare-l-arte-di-francesco-mezzina/

Testi editoriali originali; verificare con l’associazione recapiti, descrizioni e diritti delle immagini prima della pubblicazione.
