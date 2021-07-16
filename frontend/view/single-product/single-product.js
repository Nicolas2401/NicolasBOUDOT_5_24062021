/**
 * Gère l'affichage et les interactions de la page produit
 */



/* -----------------------------
    Déclaration des fonctions   
-------------------------------- */

//Déclaration de la fonction principale
async function main() {
    //On attend que le produit soit affiché /!\ Important
    await displayProduct();
    //Pour pouvoir ciblé les éléments pour le calcul
    document
        .getElementById("product-quantity")
        .addEventListener("input", calcTotalPrice);
    //Au clic sur "Ajouter au panier"
    document
        .querySelector(".btn-cart")
        .addEventListener("click", addToCart);
}


// Récupération de l'ID contenu dans l'url
function getIdInUrl() {
    return window
        .location //Récupère l'url
        .search //Récupère uniquement la partie ?{...}
        .replace("?_id=", ""); //Supprime une partie de la chaine pour n'avoir que l'id
}


//Récupération des données HTTP
function getProduct() {
    //On récupère l'id du produit depuis l'url
    const idProduct = getIdInUrl();
    //On fait une requête du produit seulement
    return fetch("http://localhost:3000/api/teddies/" + idProduct)
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


//Affichage de l'élément sélectionné
async function displayProduct() {
    //On récupère les éléments
    const product = await getProduct();

    //Récupère et clone le template
    const template = document.querySelector(".template-single-product");
    const clone = document.importNode(template.content, true);
        //Récupère un élément et modifie son contenu
        clone.querySelector(".single-product__image").src = product.imageUrl;
        clone.querySelector(".single-product__image").alt = "Image du produit : " + product.name;
        clone.querySelector(".single-product__title").textContent = product.name;
        clone.querySelector(".single-product__price").textContent = product.price / 100 + "€";
        clone.querySelector(".single-product__text").textContent = product.description;

        //Pour chaque couleur disponible
        for (color of product.colors) {
            //On crée une option
            const option = document.createElement("option");
                option.value = color;
                option.textContent = color;
            //Et on l'ajoute au select
            clone.querySelector(".single-product__select-color").appendChild(option);
        }

        clone.querySelector(".single-product__total-price").value = product.price / 100 + "€";

    //Ajoute le clone dans le DOM
    document.querySelector(".single-product").appendChild(clone);

    //Une fois les produits listés, on supprime le template
    document.querySelector(".template-single-product").remove();
}


//Calcul le prix total
function calcTotalPrice() {
    //On récupère les éléments
    const productPrice = parseInt(document.querySelector(".single-product__price").textContent, 10); //string --> number
    let quantity = document.getElementById("product-quantity").value;
    
    //On calcul
    let totalPrice = productPrice * quantity;

    //On injecte
    document.querySelector(".single-product__total-price").value = totalPrice + "€";
}


//Ajout des données dans localStorage
async function addToCart(e) {
    //On récupère la quantité sélectionnée
    const productSelectedQuantity = document.getElementById("product-quantity").value;
    
    //Si elle est valide
    if (productSelectedQuantity > 0) {
         //On désactive le clic sur le bouton
        e.preventDefault();

        //On récupère les données du produit (pour obtenir l'id ensuite)
        const product = await getProduct();

        //On récupère les données choisis par l'utilisateur
        let productSelected = {
            color: document.querySelector(".single-product__select-color").value,
            // description: document.querySelector(".single-product__text").textContent,
            id: product._id,
            // imgUrl: product.imageUrl,
            name: document.querySelector(".single-product__title").textContent,
            quantity: parseInt(document.getElementById("product-quantity").value)
            // total: parseInt(document.querySelector(".single-product__total-price").value)
        }

        //On récupère la key "products" contenu dans le Storage (s'il y en a)
        let productsInLocalStorage = localStorage.getItem("products");

        //Donc on vérifie, s'il y en a pas
        if (!productsInLocalStorage) {
            //On crée un tableau de produit à envoyer au Storage
            const productsToSetInStorage = [];
            //On push le produit sélectionné
            productsToSetInStorage.push(productSelected);
            //On envoi dans le Storage le tableau (au format JSON)
            localStorage.setItem("products", JSON.stringify(productsToSetInStorage));
        }
        //Si il y en a
        else {
            //On récupère le Storage (en le convertissant en tableau d'objets js key: value)
            productsInLocalStorage = JSON.parse(localStorage.getItem("products"));

            //On crée un tableau de produit à envoyer au Storage
            const productsToSetInStorage = [];

            //On vérifie que pour chaque produit du Storage
            productsInLocalStorage.map(function(item) {
                if (productSelected.id == item.id && productSelected.color == item.color) {
                    //On modifie la quantité à envoyer (somme qui écrase la quantité stocké dans Storage)
                    productSelected.quantity = parseInt(productSelected.quantity) + parseInt(item.quantity);
                }
                else {
                    //Si le produit n'est pas le même, on le remet dans le tableau prêt à repartir (pas d'actualisation de quantité)
                    productsToSetInStorage.push(item);
                }
            });

            //On push le produit sélectionné dans le tableau d'envoi au Storage
            productsToSetInStorage.push(productSelected);
            //On envoi au Storage le tableau (en JSON)
            localStorage.setItem("products", JSON.stringify(productsToSetInStorage));
        }

        popUpAddToCart();       
    }
}

function popUpAddToCart() {
    const goToCart = window.confirm(
            `Produit ajouté au panier !

OK : Voir le panier ou ANNULER : Rester sur cette page`);

    if (goToCart) {
        window.location.href = "../panier/panier.html";
    }
}



/* -----------------------------
    Lancement des fonctions      
-------------------------------- */

main();
