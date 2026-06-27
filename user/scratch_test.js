// ES Module style since package.json is type: module

async function runTest() {
  try {
    console.log('1. Logging in NPP...');
    const loginRes = await fetch('http://localhost:5000/api/public/npp-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'saovang', password: 'npp123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${await loginRes.text()}`);
    }
    
    const { token, user } = await loginRes.json();
    console.log(`\u2705 Logged in as ${user.fullName} (${user.username}). Token obtained.`);

    console.log('\n2. Fetching scan data for an active serial SV-000080...');
    const scanRes = await fetch('http://localhost:5000/api/public/scan/SV-000080');
    if (!scanRes.ok) {
      throw new Error(`Scan failed: ${await scanRes.text()}`);
    }
    const scanData = await scanRes.json();
    console.log(`\u2705 Scan data retrieved. Product: ${scanData.product.name}. Current Label Status: ${scanData.label.status}`);

    console.log('\n3. Fetching NPP stores...');
    const storesRes = await fetch('http://localhost:5000/api/public/npp-stores', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!storesRes.ok) {
      throw new Error(`Get stores failed: ${await storesRes.text()}`);
    }
    const { stores } = await storesRes.json();
    console.log(`\u2705 Found ${stores.length} stores.`);
    if (stores.length === 0) {
      throw new Error('No stores found for NPP');
    }
    const targetStore = stores[0];
    console.log(`Selecting Store: ${targetStore.name} (${targetStore.address})`);

    console.log('\n4. Submitting single entry (distributing SV-000080)...');
    const entryRes = await fetch('http://localhost:5000/api/public/distributor-entry-single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serialNumber: 'SV-000080',
        distributorName: targetStore.name,
        distributorAddress: targetStore.address
      })
    });

    if (!entryRes.ok) {
      throw new Error(`Entry submission failed: ${await entryRes.text()}`);
    }
    
    const entryResult = await entryRes.json();
    console.log('\u2705 Entry response:', entryResult);

    console.log('\n5. Re-fetching scan data to check updated distributor info...');
    const scanCheckRes = await fetch('http://localhost:5000/api/public/scan/SV-000080');
    const scanCheckData = await scanCheckRes.json();
    console.log('Updated Label distributorName:', scanCheckData.label.distributorName);
    console.log('Updated Label distributorAddress:', scanCheckData.label.distributorAddress);
    
    if (scanCheckData.label.distributorName === targetStore.name) {
      console.log('\n\ud83c\udf89 ALL TESTS PASSED SUCCESSFULLY! The flow is 100% functional!');
    } else {
      console.log('\n\u274c TEST FAILED: distributor name was not updated correctly.');
    }

  } catch (error) {
    console.error('\n\u274c Test encountered error:', error);
  }
}

runTest();
