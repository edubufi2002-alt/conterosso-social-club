import ClubApp from '@/components/ClubApp';import {notFound} from 'next/navigation';
const sections:Record<string,string>={'calendario':'events','chi-siamo':'about','tesseramento':'membership','archivio':'archive','galleria':'gallery','contatti':'contact','area-personale':'account','gestionale':'admin','accedi':'login'};
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections[section])notFound();return <ClubApp initialView={sections[section]}/>}
