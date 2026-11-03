# Collaudo di accettazione · 3 novembre 2026

Ambiente: HTML di presentazione in Chrome, archivio locale e identità sintetiche. Esecuzione guidata per ruolo da parte del tester. Non sono stati coinvolti soci reali.

| Scenario | Criterio di accettazione | Risultato osservato |
|---|---|---|
| Visitatore apre Il club | Trova l’invito alla partecipazione | Visibile «Cosa succede dopo l’ultima nota?» |
| Visitatore apre Diventa socio | La tessera contiene un logo leggibile dal browser | Immagine con etichetta accessibile, caricata con dimensione naturale positiva |
| Socio apre The Buonamico’s Band | Appuntamento del 7 novembre selezionabile, dati di prova riconoscibili | Scheda aperta, avviso su orario/prezzo/capienza simulati, Giulia Demo precompilata |
| Socio conferma sul posto | La prenotazione deve apparire nell’area personale | Presente la scheda della band dopo la conferma |
| Responsabile apre Prenotazioni e presenze | Deve ritrovare lo stesso partecipante e saldo | Giulia Demo, tessera valida, 10 € da incassare |
| Responsabile tenta check-in prima del saldo | Ingresso bloccato | «Prima dell’ingresso è necessario saldare il contributo» |
| Responsabile registra incasso e ripete check-in | Saldo zero e presenza registrata | Visualizzati 0 € da incassare e «Presente» |
| Visitatore apre Archivio | Data passata reperibile | Trovata la scheda di The Bump |

## Revisione backend

Prima il calendario richiedeva la lettura di /club e ricalcolava l’occupazione scorrendo le prenotazioni per ogni incontro. Ora il server legge /club/catalogueV1, contenente attività pubblicate, configurazione pubblica e conteggi per incontro. Le transazioni aggiornano anche il catalogo. Gli hold e le offerte in scadenza liberano i posti al momento della lettura; l’API restituisce solo la disponibilità risultante. La prima lettura su un database precedente inizializza il catalogo. Il controllo della sessione recupera il singolo account direttamente.

Misura riproducibile locale: stato demo al 3 novembre con 10.000 copie annullate della prenotazione demo-jazz. Serializzazione JSON dello stato prima della proiezione: 5.300.043 byte. Catalogo persistibile: 12.901 byte. La misura riguarda la dimensione dei dati sintetici, non il traffico fatturato o la latenza Firebase.

Rischio residuo: le scritture concorrenti, inclusi prenotazioni e incassi, condividono ancora una transazione su /club e ricostruiscono il catalogo. Anche le letture del gestionale possono caricare l’intero aggregato. Prima dell’apertura ai soci occorre misurare su staging latenza p95, retry, errori e overbooking con richieste concorrenti sugli stessi eventi e su eventi diversi. Nessuna soglia di utenti simultanei è stata certificata. La separazione delle transazioni per attività richiede una migrazione con riconciliazione dei dati contabili.

Le 11 date sono caricate nella demo. Lo script scripts/import-programme.ts importa in Firebase solo bozze mancanti con capienza zero. Prima di pubblicarle l’operatore verifica date, orari, prezzo, capienza e condizioni. Nessuna modifica al database live durante il collaudo.
