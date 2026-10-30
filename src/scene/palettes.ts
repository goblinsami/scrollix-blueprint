import type { ArtPreset } from '../contracts/BlueprintProject';
export interface ScenePalette {background:string;floor:string;ink:string;muted:string;grid:string;accent:string;wall:string;edge:string}
// Existing M3 materials are intentionally retained: finishing belongs to M3.5-C.
export const palettes:Record<ArtPreset,ScenePalette>={
  paper:{background:'#e9e6dc',floor:'#f7f4ea',ink:'#26382f',muted:'#728077',grid:'#dce0d4',accent:'#b78954',wall:'#e5e4d7',edge:'#7b897d'},
  'inverted-blueprint':{background:'#091b32',floor:'#102b49',ink:'#e5f4f5',muted:'#92b5cc',grid:'#254461',accent:'#d5a872',wall:'#3c6684',edge:'#bad9e8'},
  'material-study':{background:'#d8d0c4',floor:'#eee6d9',ink:'#514537',muted:'#8f7c62',grid:'#d6c7b3',accent:'#b27144',wall:'#c7ac8d',edge:'#816a50'},
};
