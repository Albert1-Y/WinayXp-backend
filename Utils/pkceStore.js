// Utils/pkceStore.js (ESM)
import { db } from '../database/connection.database.js';

export async function savePkceState(state, codeVerifier, redirectUri) {
  await db.query(
    `INSERT INTO oauth_state(state, code_verifier, redirect_uri, creado_en)
     VALUES($1,$2,$3,NOW())
     ON CONFLICT (state) DO UPDATE
       SET code_verifier=EXCLUDED.code_verifier,
           redirect_uri=EXCLUDED.redirect_uri`,
    [state, codeVerifier, redirectUri]
  );
}

export async function getPkceState(state) {
  const { rows } = await db.query(
    `SELECT code_verifier, redirect_uri
       FROM oauth_state
      WHERE state=$1`,
    [state]
  );
  return rows[0] || null;
}

export async function deletePkceState(state) {
  await db.query(`DELETE FROM oauth_state WHERE state=$1`, [state]);
}
