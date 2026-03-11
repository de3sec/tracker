// File: test_api.mjs
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";
let sessionCookie = "";

async function login() {
  console.log("Fetching CSRF token...");
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  
  let cookies = csrfRes.headers.raw()['set-cookie'] || [];
  let csrfCookie = cookies.map(c => c.split(';')[0]).join('; ');

  console.log("Logging in with admin/admin123...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie
    },
    body: new URLSearchParams({
      csrfToken: csrfToken,
      username: "admin",
      password: "admin123",
      json: "true"
    }),
    redirect: "manual"
  });

  const loginCookies = loginRes.headers.raw()['set-cookie'] || [];
  sessionCookie = loginCookies.map(c => c.split(';')[0]).join('; ');

  if (!sessionCookie.includes("authjs.session-token") && !sessionCookie.includes("next-auth.session-token")) {
    console.error("Failed to login or retrieve session cookie");
    console.log(await loginRes.text());
    return false;
  }
  
  console.log("Logged in successfully!");
  return true;
}

let testClaimId = "";

async function testGET() {
  console.log("\nTesting GET /api/claims...");
  const res = await fetch(`${BASE_URL}/api/claims`, {
    headers: { "Cookie": sessionCookie }
  });
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    console.log(`Successfully fetched claims. Count: ${data.claims?.length || 0}`);
  } else {
    console.error(data);
  }
}

async function testPOST() {
  console.log("\nTesting POST /api/claims...");
  const newClaim = {
    date: new Date().toISOString().split("T")[0],
    partyName: "API Test Party",
    vehicleNumber: "TEST-1234",
    tyreModel: "TEST MODEL API",
    stencilNumber: "STN-999",
    claimDispatchDate: "",
    claimDispatchPlace: "",
    claimPassAmount: 500,
    claimReturnDate: ""
  };
  
  const res = await fetch(`${BASE_URL}/api/claims`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": sessionCookie
    },
    body: JSON.stringify(newClaim)
  });
  
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  if (res.ok && data.id) {
    console.log(`Successfully created claim with ID: ${data.id}`);
    testClaimId = data.id;
  } else {
    console.error(data);
  }
}

async function testPUT() {
  if (!testClaimId) return;
  console.log(`\nTesting PUT /api/claims/${testClaimId}...`);
  const updateData = {
    claimPassAmount: 1000
  };
  
  const res = await fetch(`${BASE_URL}/api/claims/${testClaimId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Cookie": sessionCookie
    },
    body: JSON.stringify(updateData)
  });
  
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    console.log(`Successfully updated claim, new amount: ${data.claimPassAmount}`);
  } else {
    console.error(data);
  }
}

async function testDELETE() {
  if (!testClaimId) return;
  console.log(`\nTesting DELETE /api/claims/${testClaimId}...`);
  const res = await fetch(`${BASE_URL}/api/claims/${testClaimId}`, {
    method: "DELETE",
    headers: { "Cookie": sessionCookie }
  });
  
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    console.log(`Successfully deleted claim ${testClaimId}`);
  } else {
    console.error(data);
  }
}

async function runTests() {
  const loggedIn = await login();
  if (!loggedIn) return;
  
  await testGET();
  await testPOST();
  await testGET();
  await testPUT();
  await testGET();
  await testDELETE();
  await testGET();
}

runTests();
