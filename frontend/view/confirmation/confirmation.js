/**
 * Gère l'affichage et les interactions de la page confirmation
 */



/* -----------------------------
    Déclaration des fonctions   
-------------------------------- */

/* --- Fonction Principale --- */

function main() {
    //On affiche les infos à l'arrivé sur la page
    displayOrderInfos();
    //Puis on supprime les toutes les données du localStorage
    removeLocalStorage();
}



/* --- Affichage de données --- */

function displayOrderInfos() {
    //Récupération des données dans le Storage
    const order = JSON.parse(localStorage.getItem("order"));

    //Si il y a une réponse en cours du backend
    if (order) {
        //Remplacement des données brut du HTML
        document.querySelector(".confirmation__prix").textContent = order.price + "€";
        document.querySelector(".confirmation__identifiant").textContent = order.id;
    }

    else {
        //Redirection vers la page d'accueil
        window.location = "../index/index.html";
    }
}



/* --- Suppresion de données --- */

function removeLocalStorage() {
    //Suppression du localStorage
    localStorage.clear();
}



/* -----------------------------
    Lancement des fonctions      
-------------------------------- */
main();