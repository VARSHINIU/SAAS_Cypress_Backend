class Adtoken {
    static set() {
      cy.request({
        method: "POST",
        url: "http://localhost:8080/login",
        body: {
          password: 'sree',
          username: "sree"
        }
      }).then((response) => {
        Cypress.env("Adtoken", response.body.token); 
        Cypress.env("sree", "somu"); 
      });
    }
  }
  export default Adtoken;
  