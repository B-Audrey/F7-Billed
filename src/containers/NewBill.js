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
        const filePath = e.target.value.split(/\\/g)
        const fileName = filePath[filePath.length - 1]
        if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/jpg') {
            file.value = ''
            this.document.querySelector(`input[data-testid="file"]`).parentNode.innerHTML = '<label for="file" class="bold-label">Justificatif</label><input required type="file" class="form-control blue-border" data-testid="file" />';
            this.document.querySelector(`input[data-testid="file"]`).addEventListener('input', this.handleChangeFile)
            return window.alert('Votre format de fichier est invalide.\nVeuillez le modifier par un fichier ayant l\'extension .png, .jpg ou .jpeg ppur pouvoir enregistrer')
        }
        const formData = new FormData()
        const email = JSON.parse(localStorage.getItem('user')).email
        formData.append('file', file)
        formData.append('email', email)
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
            }).catch(error => console.error(error))
    }
    handleSubmit = e => {
        e.preventDefault()
        let email = JSON.parse(localStorage.getItem('user')).email
        if(!email){
            const userString = localStorage.getItem('user');
            const user = JSON.parse(JSON.parse(userString));
            email = user.email;

        }
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
        console.log('bill', bill)
        this.updateBill(bill)
        this.onNavigate(ROUTES_PATH['Bills'])
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
                .catch(error => console.error(error))
        }
    }
}
