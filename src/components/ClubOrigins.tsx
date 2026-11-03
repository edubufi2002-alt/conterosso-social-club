const programme = [
  ['11 ottobre', 'Bene Benni', 'Un omaggio a Stefano Benni tra teatro, scrittura, musica e poesia.'],
  ['17 ottobre', 'Like a Rolling Stones', 'Mauro Stallone, con chitarra e racconti, segue gli intrecci fra Bob Dylan, Beatles e Rolling Stones.'],
  ['24 ottobre', 'Cantar poetando', 'Rime, strambotti e quartine incontrano il jazz e le ballate folk.'],
  ['31 ottobre', 'The Bump', 'Vince Abbracciante, Dado Penta e Antonio Di Lorenzo tra jazz urbano, shakebeat e brasil-jazz.'],
  ['7 novembre', 'The Buonamico’s Band', 'Dal Messico, rock, cumbia, soul e funk.'],
  ['14 novembre', 'Vento d’incanto', 'Adriana Polo e Roberto Gagliardi in uno spettacolo per voce, sax e altri strumenti.'],
  ['21 novembre', 'Tukuru', 'Africa e Mediterraneo si incontrano nel desert blues, nell’afrobeat e nel funk.'],
  ['29 novembre', 'Festival Viator · XII edizione', 'Menti, cuori e corpi sulle vie francigene del Sud, a cura di Giovannangelo de Gennaro.'],
  ['7 dicembre', 'Fabrizio Mandara', 'Un viaggio nella canzone napoletana classica, per voce e chitarra.'],
  ['13 dicembre', 'Festival Viator · XII edizione', 'Seconda data in calendario della rassegna sulle vie francigene del Sud.'],
  ['19 dicembre', 'Dirty Trainload', '«An unsolicited delivery of dissident blues», con chitarra, armonica, basso, theremin e batteria.'],
];
export function ClubProgramme(){
 return <section className="programme-print"><span className="eyebrow">DALLA LOCANDINA DEL CLUB</span><h2>Autunno 2026</h2><p>Programma in itinere pubblicato da @conterossosocialclub. Ingresso riservato ai soci. Per orari, disponibilità e prenotazioni contatta il club al <a href="tel:3292404626">329 240 4626</a>.</p>
 <div className="programme-list">{programme.map(([date,title,description])=><article key={date}><strong>{date}</strong><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>;
}
export function ClubOrigins(){
 return <section className="origin-story"><span className="eyebrow">DAL RACCONTO DELL’IDEATORE</span><h2>«L’idea nasce da un sogno.»</h2>
 <p>Da ragazzo immaginava un posto dove, finito un concerto, si potesse restare a discutere di un libro o di politica. Quel desiderio gli è rimasto dentro. Studiando la rivoluzione messicana lo ha ritrovato nella Casa Blu di Frida Kahlo e Diego Rivera, nelle conversazioni fra artisti, intellettuali e attivisti. A Molfetta ha voluto dare a quel sogno una sala, un palco e una porta aperta.</p>
 <h3>Perché Conterosso?</h3><p>Il nome viene dal transatlantico Conte Rosso. Nel racconto dell’ideatore, sulla stessa nave viaggiavano persone in crociera e migranti in cerca di fortuna. Nei porti, insieme alle persone, sbarcavano suoni nuovi. È questa l’immagine che il club porta nel nome: una banchina dove storie lontane si incontrano e cambiano la musica di chi le ascolta.</p>
 <h3>I primi venticinque</h3><p>Familiari, amici di sempre e compagni di tante battaglie sono stati i venticinque soci fondatori. Nell’intervista l’ideatore ricorda che, nei primi cinque mesi, i soci erano già diventati seicento. A restargli impressa è la voglia di ritrovarsi di persona, in un confronto «fatto di carne ed occhi e suono della voce».</p>
 <h3>Una casa anche per le idee degli altri</h3><p>Tra le prime proposte arrivate al club c’erano letture animate per bambini, laboratori di cucina, concerti di musica del Gambia e incontri sulla pace. L’ideatore racconta anche delle sale per studiare e lavorare insieme e del teatro attrezzato per ospitare iniziative di altre realtà del territorio.</p></section>;
}
