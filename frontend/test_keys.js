
async function testToken() {
    const CLIENT_ID = '96dHZVzsAuuqXdt6eC8WYuFaMW_RghHzLbpczULmZeSaXF_Jk-BuQpIfHSKxrhZD4nF5hhv33WqRsx3tCyk6Fd86IHGohhzi';
    const CLIENT_SECRET = 'lrFxI-iSEg8yZGVBUWyJwo6KycKRjvjrUV4EEg8jGYw-YC19ZJ4dvE4XtAy-IBtCzcBG9LdrFPXTABEKPijj6qP6XXVLi85A-dTGvVoP21c=';

    try {
        const response = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        console.log('SUCCESS: Token received');
        console.log('Access Token:', data.access_token);
    } catch (error) {
        console.error('ERROR: Failed to get token');
        console.error(error.message);
    }
}

testToken();
