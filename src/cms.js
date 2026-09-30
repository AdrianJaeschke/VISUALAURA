import {CASES as fallbackCases} from "./cases.js";

/**
 * Expected CMS/API case shape:
 * {
 *   id,
 *   slug,
 *   title,
 *   year,
 *   location: { city, country, lat, lng },
 *   disciplines: string[],
 *   tags: string[],
 *   palette: string[],
 *   intensity: 0..1,
 *   complexity: 0..1,
 *   featured?: boolean,
 *
 *   // Backwards-compatible hero fields:
 *   hero?: {
 *     image?: string,
 *     video?: string
 *   },
 *
 *   // Preferred media model for the spatial case presentation:
 *   presentation?: {
 *     video?: string | { src: string, poster?: string },
 *     images?: Array<string | {
 *       src: string,
 *       alt?: string,
 *       width?: number,
 *       height?: number
 *     }>
 *   }
 * }
 *
 * The frontend currently tries /api/cases and falls back to src/cases.js.
 * There is no real CMS/backend connected yet.
 */
export async function loadCases(){
  try{
    const res=await fetch("/api/cases",{headers:{Accept:"application/json"}});
    if(!res.ok) throw new Error(`Case API ${res.status}`);
    const data=await res.json();
    const cases=Array.isArray(data)?data:data.cases;
    if(!Array.isArray(cases)||!cases.length) throw new Error("No cases");
    return cases;
  }catch(err){
    console.info("VISUALAURA: using local case data until /api/cases is connected.",err);
    return fallbackCases;
  }
}