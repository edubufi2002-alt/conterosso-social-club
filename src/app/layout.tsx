import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Conterosso Social Club · Molfetta',description:'Musica, parole e incontri a Molfetta. Scopri Conterosso Social Club, le attività e come partecipare.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>}
