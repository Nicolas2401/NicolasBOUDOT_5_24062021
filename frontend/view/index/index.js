/**
 * Gère l'affichage et les interactions de la page d'accueil
 */



/* -----------------------------
    Déclaration des fonctions   
-------------------------------- */

//Récupération des données HTTP
function getProducts() {
    return fetch("http://localhost:3000/api/teddies")
        .then(function(res) {
            if(res.ok) {
                return res.json();
            }
        })
        .then(function(data) {
            return data;
        })
        .catch(function(err) {
            console.error("error", err);
        })
}

//Affichage des éléments récupérés
async function displayProducts() {
    //On récupère les éléments
    const listingProducts = await getProducts();

    //Pour chaque produit
    for(product of listingProducts) {
        //Récupère et clone le template
        const template = document.querySelector(".template-card-produits");
        const clone = document.importNode(template.content, true);
            //Récupère un élément et modifie son contenu
            clone.querySelector(".card-produits__image").src = product.imageUrl;
            clone.querySelector(".card-produits__image").alt = "Image du produit : " + product.name;
            clone.querySelector(".card-produits__title").textContent = product.name;
            clone.querySelector(".card-produits__price").textContent = product.price / 100 + "€";
            clone.querySelector(".card-produits__text").textContent = product.description;
            clone.querySelector(".card-produits__link").href += "?_id=" + product._id;

        //Ajoute le clone dans le DOM
        document.querySelector(".mea-products__listing > .row").appendChild(clone);
    }

    //Une fois les produits listés, on supprime le template
    document.querySelector(".template-card-produits").remove();
}



/* -----------------------------
    Lancement des fonctions      
-------------------------------- */

displayProducts();