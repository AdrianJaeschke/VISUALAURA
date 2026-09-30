import {CASES as fallbackCases} from "./cases.js";

async function fetchCases(url){
  const res=await fetch(url,{
    headers:{Accept:"application/json"},
    cache:"no-store"
  });

  if(!res.ok)throw new Error(`${url} → ${res.status}`);

  const data=await res.json();
  const cases=Array.isArray(data)?data:data.cases;

  if(!Array.isArray(cases)||!cases.length){
    throw new Error(`${url} contains no cases`);
  }

  return cases;
}

/**
 * Zero-code content flow:
 *
 * 1. Upload folders to /media/<case-name>/
 * 2. GitHub Action runs tools/build-cases.py
 * 3. The generated /media/cases.json becomes the frontend data source
 *
 * Optional future backend:
 * /api/cases is checked when the local generated manifest has no cases.
 */
export async function loadCases(){
  try{
    return await fetchCases("/media/cases.json");
  }catch(manifestError){
    console.info("VISUALAURA: no generated media manifest yet.",manifestError);
  }

  try{
    return await fetchCases("/api/cases");
  }catch(apiError){
    console.info("VISUALAURA: /api/cases unavailable, using demo fallback.",apiError);
  }

  return fallbackCases;
}
