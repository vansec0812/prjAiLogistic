/** Presentation category from the entered temperature range, not a calendar season or forecast. */
export function temperatureSeason(min:number|null,max:number|null):string {
  if(min===null||max===null||!Number.isFinite(min)||!Number.isFinite(max)||min>max)return '';
  const average=(min+max)/2;
  return average<15?'Mùa lạnh':average<25?'Mùa mát':average<30?'Mùa ấm':'Mùa nóng';
}
