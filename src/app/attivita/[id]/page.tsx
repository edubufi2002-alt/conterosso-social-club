import ClubApp from '@/components/ClubApp';
export default async function Page({params}:{params:Promise<{id:string}>}){return <ClubApp initialView="event" initialEventId={(await params).id}/>}
