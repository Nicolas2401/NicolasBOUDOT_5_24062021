/**
 * Gère l'affichage et les interactions de la page panier
 */



//Récupération des templates avant toute chose
const templateCartEmpty = document.querySelector(".template-panier-vide");
const templateCartFull = document.querySelector(".template-panier-plein");
const templateCardCart = document.querySelector(".template-card-cart");



/* -----------------------------
    Déclaration des fonctions   
-------------------------------- */

/* --- Fonction Principale --- */

function main() {
    //On attend l'affichage du template en fonction de l'état du panier
    displayCartTemplate();
}



/* --- Récupèration de données --- */

function getProductById(product) {
    return fetch("http://localhost:3000/api/teddies/" + product.id)
        .then(function(res) {
            if (res.ok) {
                return res.json();
            }
        })
        .then(function(data) {
            return data;
        })
        .catch(function(err) {
            console.log("err: ", err);
        })
}

function getProductsInStorage() {
    return JSON.parse(localStorage.getItem("products"));
}



/* --- Calculs --- */

function calcSubTotalPrice(price, quantity) {
    return (price * quantity) / 100;
}

function calcTotalPrice() {
    //Récupère tous les input "Sous-total"
    const inputProductsPrice = document.querySelectorAll(".card-cart__subtotal");
    let sumProductPrice = 0;
    
    //Additionne chaque valeur de ces input
    for (const price of inputProductsPrice) {
        sumProductPrice += parseInt(price.value);
    }

    return sumProductPrice;
}

//Pour plus de sécurité, on recalcul le tout avec le prix du serveur et la quantité du Storage
async function calcOrderPrice() {
    //On crée une variable pour sommer les montants
    let priceOrder = 0;

    //On récupère les produits du Storage
    const productsInStorage = getProductsInStorage();

    for (const product of productsInStorage) {
        //On récupère le produit du serveur par son ID
        const productById = await getProductById(product);
        
        //On calcul le montant total de la commande
        priceOrder = priceOrder + (productById.price * product.quantity) / 100;
    }

    return priceOrder;
}



/* --- Injection de données --- */

async function setDataInCartTemplateFull() {
    //On supprime le template de base de card-cart
    templateCardCart.remove();

    //On récupère les produits du Storage
    const productsInStorage = getProductsInStorage();

    //Pour chaque produit dans le storage
    for (const product of productsInStorage) {
        //On récupère le produit du serveur par son ID
        const productById = await getProductById(product);

        //On clone le template de card-cart
        const cloneCardCart = templateCardCart.cloneNode(true);

        //On injecte les valeurs soit du produit (backend) soit du produit choisi par l'utlisateur
        cloneCardCart.querySelector(".card-cart__image").src = productById.imageUrl;
        cloneCardCart.querySelector(".card-cart__image").alt = productById.name;
        cloneCardCart.querySelector(".card-cart__title").textContent = productById.name;
        cloneCardCart.querySelector(".card-cart__text").textContent = productById.description;
        cloneCardCart.querySelector(".card-cart__quantity").value = product.quantity;
        cloneCardCart.querySelector(".card-cart__price").value = productById.price / 100 + "€";
        cloneCardCart.querySelector(".card-cart__subtotal").value = calcSubTotalPrice(productById.price, product.quantity) + "€";

        //Récupère toutes les couleurs disponible du produit
        for (const color of productById.colors) {
            //Pour chaque couleur disponible, on crée un élément <option>
            const option = document.createElement("option");
                option.value = color;
                option.textContent = color;

            //Récupère le choix de le couleur pour la mettre en selected
            if (color == product.color) {
                option.setAttribute("selected", true);
            }

            //On les ajoutes dans le DOM
            cloneCardCart.querySelector(".card-cart__select-color").appendChild(option);
        }


        /* --- Évenements --- */

        //Au changement de couleur
        cloneCardCart.querySelector(".card-cart__select-color").addEventListener("input", function() {
            //On change la couleur stocké dans le Storage (ou la quantité si elle est déjà présente)
            setModifColorProductInStorage(product, cloneCardCart);
            //On supprime les templates des cards
            removeCardTemplate();
            //On réaffiche le template du panier en fonction de son état (vide ou plein)
            displayCartTemplate();
        });

        //Au changement de quantité
        cloneCardCart.querySelector(".card-cart__quantity").addEventListener("input", function() {
            //On recalcul et on affiche le sous-total de chaque produit
            cloneCardCart.querySelector(".card-cart__subtotal").value = calcSubTotalPrice(productById.price, this.value) + "€";
            
            //On recalcul et on affiche le nouveau Total
            document.querySelector(".panier__total").textContent = calcTotalPrice() + "€";

            //On change la quantité stocké dans le Storage
            setModifQuantityProductInStorage(product, cloneCardCart);
        });

        //Au clic sur le bouton supprimer
        cloneCardCart.querySelector(".btn-delete").addEventListener("click", function() {
            //On supprime le produit du Storage
            removeProductFromStrorage(product);
            //Pour refaire un appel de template en fonction de la situation : panier vide ou plein ?, etc.
            displayCartTemplate();
        });

        /* --- Fin Événements --- */


        //On ajoute le clone au DOM
        document.querySelector(".panier-plein__listing").appendChild(cloneCardCart);

        //On calcul le total du panier
        document.querySelector(".panier__total").textContent = calcTotalPrice() + "€";
    }
}


function setModifColorProductInStorage(product, cloneCardCart) {
    //On récupère tous les produits du Storage
    const productsInStorage = getProductsInStorage();

    //On crée un tableau de nouveaux produits (pour les modifications)
    const newProductsToSetInStorage = [];

    //On récupère l'ancienne et la nouvelle couleur
    const productOldColor = product.color;
    const productNewColor = cloneCardCart.querySelector(".card-cart__select-color").value;
    
    //On modifie la couleur du produit
    product.color = productNewColor;

    //Pour chaque produit du Storage
    productsInStorage.map(function(item) {
        //Si le produit en cours à la même couleur qu'avant
        if (product.id == item.id && productOldColor == item.color) {
            //On ajoute ce nouveau produit (car il y a modification de couleur)
            newProductsToSetInStorage.push(product);
        }
        //Sinon, si le produit en cours a maintenant la même couleur
        else if (product.id == item.id && productNewColor == item.color) {
            //On somme leurs quantités
            product.quantity = product.quantity + item.quantity;
        }
        //Sinon, les deux produits non rien à voir ensemble
        else {
            //On le remet donc dans le tableau sans y toucher
            newProductsToSetInStorage.push(item);
        }
    });

    //On envoie au Storage les nouveaux produits (avec ceux fusionnés)
    localStorage.setItem("products", JSON.stringify(newProductsToSetInStorage));
}


function setModifQuantityProductInStorage(product, cloneCardCart) {
    //On récupère tous les produits du Storage
    const productsInStorage = getProductsInStorage();

    //On crée un tableau de nouveaux produits (pour les modifications)
    const newProductsToSetInStorage = [];

    //Pour chaque produit du Storage
    productsInStorage.map(function(item) {
        if (product.id == item.id && product.color == item.color) {
            //On modifie la quantité à envoyer (écrase la quantité stocké dans Storage)
            product.quantity = parseInt(cloneCardCart.querySelector(".card-cart__quantity").value);
        }
        else {
            //Si le produit n'est pas le même, on le remet dans le tableau prêt à repartir (pas d'actualisation de quantité)
            newProductsToSetInStorage.push(item);
        }
    });

    //On push le produit sélectionné dans le tableau d'envoi au Storage
    newProductsToSetInStorage.push(product);

    //On envoi au Storage le nouveau tableau de produits modifiés (en JSON)
    localStorage.setItem("products", JSON.stringify(newProductsToSetInStorage));
}



/* --- Affichage --- */

function displayCartTemplate() {
    //Récupère les produits dans le Storage
    const productsInStorage = getProductsInStorage();
    
    //S'il y en a
    if (productsInStorage && productsInStorage.length > 0) {
        //On affiche le template du panier plein
        displayCartFullTemplate();
    }
    else {
        //On affiche le template du panier vide
        displayCartEmptyTemplate();
    }
}


function displayCartFullTemplate() {
    //On supprime tous les templates
    removeCartTemplates();
    //On affiche le template brut récupéré au début
    document.querySelector(".panier").appendChild(templateCartFull);
    //On ajoute/modifie les données du template
    setDataInCartTemplateFull();
    //On vérifie si des champs sont obligatoires
    isRequired();
    //Au clique sur le bouton d'envoie
    document.querySelector(".btn-send").addEventListener("click", form);
}


function displayCartEmptyTemplate() {
    //On supprime tous les templates
    removeCartTemplates();
    //On affiche le template brut récupéré au début
    document.querySelector(".panier").appendChild(templateCartEmpty);
}



/* --- Suppression des données --- */

function removeProductFromStrorage(product) {
    //On récupère tous les produits du Storage
    let productsInStorage = JSON.parse(localStorage.getItem("products"));

    //Pour chaque produit du Storage
    for (const element of productsInStorage) {
        //Si l'élément en cours a le même id et la même couleur que celui où on a cliqué
        if (element.id == product.id && element.color == product.color) {
            //On le supprime du tableau (en créant un nouveau tableau sans lui)
            const productToReSetInStorage = productsInStorage.filter(x => x !== element);
            //On renvoie ce nouveau tableau dans le Storage
            localStorage.setItem("products", JSON.stringify(productToReSetInStorage));
        }
    }

    //On supprime tous les card-cart
    removeCardTemplate();
}

function removeCartTemplates() {
    document.querySelector(".panier").innerHTML = "";
}

function removeCardTemplate() {
    document.querySelectorAll(".panier-plein__panier .card-cart").forEach(card => card.remove());
}



// /* --- Formulaire --- */

function isErrorForm() {
    //On récupère les input[type="text"]
    const inputsText = [
        document.getElementById("inputFirstName"),
        document.getElementById("inputLastName"),
        document.getElementById("inputAdress"),
        document.getElementById("inputCity")
    ];

    //On récupère les input[type="email"]
    const inputsEmail = [
        document.getElementById("inputEmail")
    ];


    //On supprime l'éventuelle classe d'erreur sur les inputs
    document.querySelectorAll(".input-error").forEach(function(input) {
        input.classList.remove("input-error");
    });

    //On supprime les éventuels message d'erreur
    document.querySelectorAll(".label-error").forEach(function(label) {
        label.remove();
    });
    

    //Pour chaque input[type="text"]
    inputsText.forEach(function(elementText) {
        //S'il présente une erreur
        if (!isText(elementText.value)) {
            //On crée un message d'erreur
            const labelError = document.createElement("span");
            labelError.classList.add("label-error");
            labelError.textContent = "Veuillez remplir ce champs ou le corriger";

            //S'il n'y a pas déjà un message d'erreur présent
            if (!elementText.parentElement.querySelector(".label-error")) {
                //Qu'on ajoute au DOM
                elementText.parentElement.appendChild(labelError);
            }

            //On ajoute une classe sur l'input
            elementText.classList.add("input-error");
        }
    });

    //Pour chaque input[type="email"]
    inputsEmail.forEach(function(elementMail) {
        //S'il présente une erreur
        if (!isEmail(elementMail.value)) {
            //On crée un message d'erreur
            const labelError = document.createElement("span");
            labelError.classList.add("label-error");
            labelError.textContent = "Veuillez remplir ce champs ou le corriger";

            //S'il n'y a pas déjà un message d'erreur présent
            if (!elementMail.parentElement.querySelector(".label-error")) {
                //Qu'on ajoute au DOM
                elementMail.parentElement.appendChild(labelError);
            }

            //On ajoute une classe sur l'input
            elementMail.classList.add("input-error");
        }
    });
}

function getFormData() {
    //On vérifie s'il n'y a pas d'erreur dans la saisie du formulaire
    isErrorForm();

    const formData = {
        firstName: document.getElementById("inputFirstName").value,
        lastName: document.getElementById("inputLastName").value,
        address: document.getElementById("inputAdress").value,
        city: document.getElementById("inputCity").value,
        email: document.getElementById("inputEmail").value
    }
    
    return formData;
}

function sendDataToServer() {
    //On crée un tableau pour les id des produits
    const productsId = [];
    //On récupère tous les produits du storage
    const productsInStorage = getProductsInStorage();

    //Pour chaque produit du Storage
    for (const product of productsInStorage) {
        //On ajoute son id au tableau des id
        productsId.push(product.id);
    }

    //On crée un objet à envoyer au serveur
    const order = {
        contact: getFormData(),
        products: productsId
    }

    fetch("http://localhost:3000/api/teddies/order", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
    })
    .then(function(res) {
        if (res.ok) {
            return res.json();
        }
    })
    .then(async function(data) {
        //On crée un objet à transmettre au Storage
        const orderInfos = {
            id: data.orderId,
            price: await calcOrderPrice()
        }

        //On sauvegarde l'orderId pour pouvoir l'afficher dans confirmation.html
        localStorage.setItem("order", JSON.stringify(orderInfos));

        //On redirige vers la page confirmation
        window.location = "../confirmation/confirmation.html";
    })
    .catch(function(err) {
        console.log("err: ", err);
    })
}

function isText(input) {
    const regex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;
    return regex.test(input);
}

function isEmail(input) {
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(input);
}


function form(e) {
    //On désactive le fonctionnement par défaut du bouton
    e.preventDefault();

    //On envoie les données au serveur
    sendDataToServer();
}


function isRequired() {
    //On récupère tous les inputs du formulaire
    const inputsForm = document.querySelectorAll(".panier-plein__formulaire input");

    //Pour chaque input
    inputsForm.forEach(function(input) {
        //S'il est obligatoire
        if (input.required) {
            //On crée un <span>
            const asterisk = document.createElement("span");
                asterisk.classList.add("asterisk-required");
                asterisk.textContent = " *";

            //On supprime l'éventuel span s'il est déjà présent
            if (input.previousElementSibling.querySelector(".asterisk-required")) {
                input.previousElementSibling.querySelector(".asterisk-required").remove();
            }

            //Qu'on ajoute en enfant au label associé
            input.previousElementSibling.appendChild(asterisk);
        }
    });
}



/* -----------------------------
    Lancement des fonctions      
-------------------------------- */
main();

