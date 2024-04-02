import Logout from './Logout.js'
import {ROUTES_PATH} from '../constants/routes.js';

export default class NewBill {
    constructor({document, onNavigate, store, localStorage}) {
        this.document = document
        this.onNavigate = onNavigate
        this.store = store
        const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
        formNewBill.addEventListener('submit', this.handleSubmit)
        const file = this.document.querySelector(`input[data-testid="file"]`)
        file.addEventListener('input', this.handleChangeFile)
        this.fileUrl = null
        this.fileName = null
        this.billId = null
        new Logout({document, localStorage, onNavigate})
    }

    handleChangeFile = e => {
        e.preventDefault()
        let file = this.document.querySelector(`input[data-testid="file"]`).files[0]
        // vérification que le fichier est de type jpg, jpeg ou png
        // si ce n'est pas le cas, on vide le champ et on affiche une alerte
        // on recréé le html de l'input pour en recréer un vide
        if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/jpg') {
            this.document.querySelector(`input[data-testid="file"]`).parentNode.innerHTML = '<label for="file" class="bold-label">Justificatif</label><input required type="file" class="form-control blue-border" data-testid="file" />';
            this.document.querySelector(`input[data-testid="file"]`).addEventListener('input', this.handleChangeFile)
            return window.alert('Votre format de fichier est invalide.\nVeuillez le modifier par un fichier ayant l\'extension .png, .jpg ou .jpeg ppur pouvoir enregistrer')
        }
    }
    handleSubmit = e => {
        e.preventDefault()
        let email = JSON.parse(localStorage.getItem('user')).email
        let file = e.target.querySelector(`input[data-testid="file"]`).files[0]
        const fileName = file.name
        const formData = new FormData()
        formData.append('file', file)
        formData.append('email', email)
        const bill = {
            email,
            type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
            name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
            amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
            date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
            vat: e.target.querySelector(`input[data-testid="vat"]`).value,
            pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
            commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
            fileUrl: this.fileUrl,
            fileName: this.fileName,
            status: 'pending'
        }
        if (bill.date === '') return window.alert('Veuillez renseigner une date')
        if (bill.pct > 100 || bill.pct < 0) return window.alert('Le taux de TVA doit être compris entre 0 et 100')
        if (bill.amount <= 0) return window.alert('Le montant doit être supérieur à 0')
        this.store
            .bills()
            .create({
                data: formData,
                headers: {
                    noContentType: true
                }
            })
            .then(({fileUrl, key}) => {
                this.billId = key
                this.fileUrl = fileUrl
                this.fileName = fileName
                this.updateBill(bill)
            }).catch((error) => {
            document.querySelector(`#error-message`).innerText = `Votre facture n'a pas pu être envoyée : ${error.message}`
            return console.error(error);
        })
    }


    // not need to cover this function by tests
    updateBill = (bill) => {
        if (this.store) {
            this.store
                .bills()
                .update({data: JSON.stringify(bill), selector: this.billId})
                .then(() => {
                    this.onNavigate(ROUTES_PATH['Bills'])
                })
                .catch(error => {
                    return console.error(error)
                })
        }
    }
}
