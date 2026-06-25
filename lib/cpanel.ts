const BASE_URL = process.env.CPANEL_BASE_URL!;
const USERNAME = process.env.CPANEL_USERNAME!;
const API_TOKEN = process.env.CPANEL_API_TOKEN!;
const DOMAIN = process.env.CPANEL_DOMAIN!;

function getAuthHeader() {
  return `cpanel ${USERNAME}:${API_TOKEN}`;
}

async function callCpanel(endpoint: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/execute/Email/${endpoint}?${query}`;
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`cPanel API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function createEmailAccount(params: {
  localPart: string;
  password: string;
  quotaMb: number;
}) {
  const data = await callCpanel("add_pop", {
    email: params.localPart,
    domain: DOMAIN,
    password: params.password,
    quota: String(params.quotaMb),
  });
  if (data.status !== 1) {
    throw new Error(`Failed to create mailbox: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

export async function checkEmailExists(localPart: string): Promise<boolean> {
  const data = await callCpanel("list_pops", {
    domain: DOMAIN,
    regex: `^${localPart}$`,
  });
  return Array.isArray(data.data) && data.data.length > 0;
}

export async function deleteEmailAccount(localPart: string) {
  const data = await callCpanel("delete_pop", {
    email: `${localPart}@${DOMAIN}`,
    domain: DOMAIN,
  });
  if (data.status !== 1) {
    throw new Error(`Failed to delete mailbox: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

export async function resetEmailPassword(localPart: string, newPassword: string) {
  const data = await callCpanel("passwd_pop", {
    email: localPart,
    domain: DOMAIN,
    password: newPassword,
  });
  if (data.status !== 1) {
    throw new Error(`Failed to reset password: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

export { DOMAIN };
