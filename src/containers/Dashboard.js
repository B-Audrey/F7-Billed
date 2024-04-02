import {formatDate} from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import {ROUTES_PATH} from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from './Logout.js'

export const filteredBills = (data, status) => {
    return (data && data.length) ?
        data.filter(bill => {
            let selectCondition

            // in jest environment
            if (typeof jest !== 'undefined') {
                selectCondition = (bill.status === status)
            }
            /* istanbul ignore next */
            else {
                // in prod environment
                const userEmail = JSON.parse(localStorage.getItem('user')).email
                selectCondition =
                    (bill.status === status) &&
                    ![...USERS_TEST, userEmail].includes(bill.email)
            }

            return selectCondition
        }) : []
}

export const card = (bill) => {
    const firstAndLastNames = bill.email.split('@')[0]
    const firstName = firstAndLastNames.includes('.') ?
        firstAndLastNames.split('.')[0] : ''
    const lastName = firstAndLastNames.includes('.') ?
        firstAndLastNames.split('.')[1] : firstAndLastNames

    return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

export const cards = (bills) => {
    return bills && bills.length ? bills.map(bill => card(bill)).join('') : ''
}

export const getStatus = (index) => {
    switch (index) {
        case 1:
            return 'pending'
        case 2:
            return 'accepted'
        case 3:
            return 'refused'
    }
}

export default class {
    constructor({document, onNavigate, store, bills, localStorage}) {
        this.document = document
        this.onNavigate = onNavigate
        this.store = store
        //add this current Data
        this.currentData = [
            {id: 1, isOpen: false},
            {id: 2, isOpen: false,},
            {id: 3, isOpen: false}]
        this.currentBillId = ''
        $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1))
        $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2))
        $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3))
        new Logout({localStorage, onNavigate})
    }

    handleClickIconEye = () => {
        const billUrl = $('#icon-eye-d').attr('data-bill-url')
        const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
        $('#modaleFileAdmin1').find('.modal-body').html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
        if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show')
    }

    handleEditTicket(e, bill, bills) {
        // si la facture est déjà ouverte : son id est égal à l'id de la facture courante
        // donc on ferme la facture et on ajuste son style
        if (this.currentBillId === bill.id) {
            $(`#open-bill${bill.id}`).css({background: '#0D5AE5'})
            $('.dashboard-right-container div').html(`<div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>`)
            $('.vertical-navbar').css({height: '120vh'})
            this.currentBillId = ''
        } else {
            // sinon on ouvre la facture et on modifie l'objet courant avec sa nouvelle valeur ouvert
            // on ajuste son style
            bills.forEach(b => $(`#open-bill${b.id}`).css({background: '#0D5AE5'}))
            $(`#open-bill${bill.id}`).css({background: '#2A2B35'})
            $('.dashboard-right-container div').html(DashboardFormUI(bill))
            $('.vertical-navbar').css({height: '150vh'})
            this.currentBillId = bill.id
        }
        $('#icon-eye-d').click(this.handleClickIconEye)
        $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill))
        $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill))
    }

    handleAcceptSubmit = (e, bill) => {
        const newBill = {
            ...bill,
            status: 'accepted',
            commentAdmin: $('#commentary2').val()
        }
        this.updateBill(newBill)
        this.onNavigate(ROUTES_PATH['Dashboard'])
    }

    handleRefuseSubmit = (e, bill) => {
        const newBill = {
            ...bill,
            status: 'refused',
            commentAdmin: $('#commentary2').val()
        }
        this.updateBill(newBill)
        this.onNavigate(ROUTES_PATH['Dashboard'])
    }

    handleShowTickets(e, bills, index) {
        // on récupère les factures correspondant à l'index
        const actualBills = filteredBills(bills, getStatus(index))
        // on récupère l'index de l'objet correspondant à l'index courant
        const i = this.currentData.findIndex(obj => obj.id === index)
        // si l'objet correspondant à l'index courant n'est pas ouvert
        // on ouvre les factures correspondantes à l'index courant
        // on modifie l'objet correspondant à l'index courant avec sa nouvelle valeur ouvert
        // on ajuste son style
        // on ajoute un event listener sur chaque facture pour pouvoir les ouvrir
        if (!this.currentData[i].isOpen) {
            $(`#arrow-icon${index}`).css({transform: 'rotate(0deg)'})
            $(`#status-bills-container${index}`).html(cards(actualBills))
            this.currentData[i].isOpen = true
            actualBills.forEach(bill => {
                $(`#open-bill${bill.id}`).click((e) => this.handleEditTicket(e, bill, bills))
            })
        } else {
            // sinon on ferme les factures correspondantes à l'index courant
            // on ajuste son style
            // on modifie l'objet correspondant à l'index courant avec sa nouvelle valeur fermé
            $(`#arrow-icon${index}`).css({transform: 'rotate(90deg)'})
            $(`#status-bills-container${index}`).html('')
            this.currentData[i].isOpen = false
        }
        return bills

    }

    getBillsAllUsers = () => {
        if (this.store) {
            return this.store
                .bills()
                .list()
                .then(snapshot => {
                    const bills = snapshot
                        .map(doc => ({
                            id: doc.id,
                            ...doc,
                            date: doc.date,
                            status: doc.status
                        }))
                    return bills
                })
                .catch(error => {
                    throw error;
                })
        }
    }

    // not need to cover this function by tests
    /* istanbul ignore next */
    updateBill = (bill) => {
        if (this.store) {
            return this.store
                .bills()
                .update({data: JSON.stringify(bill), selector: bill.id})
                .then(bill => bill)
                .catch(console.log)
        }
    }
}
