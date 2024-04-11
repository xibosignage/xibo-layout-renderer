export function authApp() {
    const key = 'aa4dc67ad2ab0e42aa5767f43de67c8856f107f6';
    const secret = 'ce771a437f133e596b4c54a88ef07872f381ea380cde18b10f2b1858cfd53d3e401b75958ba3d711c2563ec03d7aad5fde6011eb1bfc937a52a28019162535ac1f1eea1632b8592d19d40c85eaac7364b3b31241ddad63b8fbc75e95a0065b705451c792172debe168344eb7466633142e7f9a857d997965e6923f7fb3550d';

    fetch('http://localhost/api/authorize/access_token', {
        method: 'POST',
        body: `grant_type=client_credentials&client_id=${key}&client_secret=${secret}`,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'http://localhost:8088'
        },
    })
    .then((res) => res.json())
    .then((data) => {
        console.log({data});
    })
    .catch((reason) => console.log({reason}));
}