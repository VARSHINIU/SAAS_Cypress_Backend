class token {
  static set() {
    cy.request({
      method: "POST",
      url: "http://localhost:8080/login",
      body: {
        password: process.env.ADMIN_PASS,
        username: process.env.ADMIN
      }
    }).then((response) => {
      Cypress.env("token", response.body.token); 
    });
  }
}
export default token;
