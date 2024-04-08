/**
 * @jest-environment jsdom
 */
import mockStore from '../__mocks__/store'
import {localStorageMock} from '../__mocks__/localStorage.js';
import {fireEvent, screen, waitFor} from '@testing-library/dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import router from '../app/Router.js';
import {ROUTES, ROUTES_PATH} from '../constants/routes.js';


jest.mock('../app/store', () => mockStore);


describe('Given I am connected as an employee', () => {

    // avant chaque test, je crée une instance de NewBillUI
    beforeEach(() => {
        jest.spyOn(mockStore, 'bills')

        Object.defineProperty(window, 'localStorage', {value: localStorageMock});
        window.localStorage.setItem('user', JSON.stringify({type: 'Employee', email: 'a@a'}));
        document.body.innerHTML = NewBillUI()
    });
    // après chaque test, je nettoie les mocks générés
    afterEach(() => {
        jest.clearAllMocks();
    });


    describe('When I am on NewBill Page', () => {
        // test d'integration sur le rendu du layout vertical de la page newBills
        test('Then envelope icon in vertical layout should be highlighted', async () => {
            document.body.innerHTML = '<div id="root"></div>';
            router()
            window.onNavigate(ROUTES_PATH.NewBill)
            await waitFor(() => screen.getByTestId('icon-mail'))
            const windowIcon = screen.getByTestId('icon-mail')
            expect(windowIcon.className).toBe('active-icon')
        })
        // test unitaire handleChangeFile
        test('Then I can upload a new file on the file input', async () => {
            const newBill = getNewBillUI()
            const fileChange = attachFile(newBill);
            await waitFor(() => {
                expect(fileChange).toHaveBeenCalled();
            });
        })
        // test unitaire handleChangeFile en cas d'erreur
        test('Then my file will be refused if the format is not valid', async () => {
            const newBill = getNewBillUI()
            const fileInput = screen.getByTestId('file');
            const handleFileChange = jest.fn(newBill.handleChangeFile);
            fileInput.addEventListener('change', handleFileChange);
            const invalidFile = new File(['sample file content'], 'sample.webp', {type: 'image/webp'});
            try {
                fireEvent.change(fileInput, {target: {files: [invalidFile]}});
            } catch (err) {
                expect(fileInput.files[0]).toBeFalsy();
            }
        })
    })

    describe('When I submit my new Bill', () => {
        // test unitaire handleSubmit
        test('Then the bill should be submitted with correct data', async () => {
            await waitFor(() => screen.getByTestId('form-new-bill'))
            const newBill = getNewBillUI()
            const handleSubmitSpy = jest.spyOn(newBill, 'handleSubmit');
            fillForm();
            const fileChange = attachFile(newBill);
            await waitFor(() => {
                expect(fileChange).toHaveBeenCalled();
            });
            const form = screen.getByTestId('form-new-bill');
            const submitFn = jest.fn(newBill.handleSubmit);
            form.addEventListener('submit', submitFn);
            fireEvent.submit(form);
            expect(handleSubmitSpy).toHaveBeenCalled();
        });

        // test d'integration sur la redirection apres le submit
        test('Then I should be redirected to Bills page', async () => {
            await waitFor(() => screen.getByTestId('form-new-bill'))
            const newBill = getNewBillUI()
            const onNavigateSpy = jest.spyOn(newBill, 'handleSubmit');
            const form = screen.getByTestId('form-new-bill');
            const submitFn = jest.fn(newBill.handleSubmit);
            form.addEventListener('submit', submitFn);
            fillForm();
            const fileChange = attachFile(newBill);
            await waitFor(() => {
                expect(fileChange).toHaveBeenCalled();
            });
            fireEvent.submit(form);
            expect(onNavigateSpy).toHaveBeenCalled();

        });
        // test d'integration sur le POST de la création d'une nouvelle note de frais
        test('Then new Bill should be POSTED', async () => {
            const bill = {
                email: 'a@a',
                type: 'Transports',
                name: 'test',
                amount: '100',
                date: '2021-01-01',
                vat: '20',
                pct: '20',
                commentary: 'test',
            }
            const res = await mockStore.bills().create(bill)
            expect(res).toEqual(bill);
        });
    });


    describe('When an error occurs on API', () => {


        // test d'integration sur le message d'erreur 401

        test('post new bill fails with 401 message error', async () => {
            document.body.innerHTML = '<div id="root"></div>';
            router()
            window.onNavigate(ROUTES_PATH.NewBill)
            await waitFor(() => screen.getByTestId('form-new-bill'))
            await mockStore.bills.mockImplementationOnce(() => {
                return {
                    create: (b) => {
                        return Promise.reject(new Error('user must be authenticated'))
                    }
                }
            })
            const newBill = getNewBillUI()
            fillForm();
            attachFile(newBill);
            await new Promise(process.nextTick);

            const form = screen.getByTestId('form-new-bill');
            const submitFn = jest.fn(newBill.handleSubmit);
            form.addEventListener('submit', submitFn);
            fireEvent.submit(form);
            const message = await waitFor(() => screen.getByTestId('error-message'))
            await new Promise(process.nextTick);
            expect(message.innerText).toBe('Votre facture n\'a pas pu être envoyée : user must be authenticated')
        });


// test d'integration sur le message d'erreur 500
        test('fetches messages from an API and fails with 500 message error', async () => {
            document.body.innerHTML = '<div id="root"></div>';
            router()
            window.onNavigate(ROUTES_PATH.NewBill)
            await waitFor(() => screen.getByTestId('form-new-bill'))
            await mockStore.bills.mockImplementationOnce(() => {
                return {
                    create: (b) => {
                        return Promise.reject(new Error('Internal Server Error'));
                    }
                }
            })
            const newBill = getNewBillUI()
            fillForm();
            attachFile(newBill);
            await new Promise(process.nextTick);
            const form = screen.getByTestId('form-new-bill');
            const submitFn = jest.fn(newBill.handleSubmit);
            form.addEventListener('submit', submitFn);
            fireEvent.submit(form);
            const message = await waitFor(() => screen.getByTestId('error-message'))
            await new Promise(process.nextTick);
            expect(message.innerText).toBe('Votre facture n\'a pas pu être envoyée : Internal Server Error')

        })
    })
});


const getNewBillUI = () => {
    return new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
    });
}
const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({pathname});
}

const attachFile = (newBill) => {
    const fileInput = screen.getByTestId('file');
    const handleFileChange = jest.fn(newBill.handleChangeFile);
    fileInput.addEventListener('change', handleFileChange);
    const file = new File(['file content'], 'test.jpg', {type: 'image/jpeg'});
    fireEvent.change(fileInput, {target: {files: [file]}});
    return handleFileChange;
};
const fillForm = () => {
    screen.getByTestId('expense-type').value = 'Transports';
    screen.getByTestId('expense-name').value = 'test';
    screen.getByTestId('datepicker').value = '2021-01-01';
    screen.getByTestId('amount').value = '100';
    screen.getByTestId('vat').value = '20';
    screen.getByTestId('pct').value = '20';
    screen.getByTestId('commentary').value = 'test';
}
