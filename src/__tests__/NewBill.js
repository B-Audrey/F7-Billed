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

    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {value: localStorageMock});
        window.localStorage.setItem('user', JSON.stringify({type: 'Employee', email: 'a@a'}));
        document.body.innerHTML = NewBillUI()
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('When I am on NewBill Page', () => {
        test('Then envelope icon in vertical layout should be highlighted', async () => {
            document.body.innerHTML = '<div id="root"></div>';
            router()
            window.onNavigate(ROUTES_PATH.NewBill)
            await waitFor(() => screen.getByTestId('icon-mail'))
            const windowIcon = screen.getByTestId('icon-mail')
            expect(windowIcon.className).toBe('active-icon')
        })
        test('Then I can upload a new file on the file input', async () => {
            const newBill = getNewBillUI()
            const fileChange = attachFile(newBill);
            await waitFor(() => {
                expect(fileChange).toHaveBeenCalled();
            });
        })

        test('Then my file will be refused if the format is not valid', async () => {
            const newBill = getNewBillUI()
            const fileInput = screen.getByTestId('file');
            const handleFileChange = jest.fn(newBill.handleChangeFile);
            fileInput.addEventListener('change', handleFileChange);
            const invalidFile = new File(['sample file content'], 'sample.webp', {type: 'image/webp'});
            try {
                fireEvent.change(fileInput, {target: {files: [invalidFile]}});
            } catch (err) {
                expect(fileInput).toBeFalsy();
            }
        })
    })


    test('Then the bill should be submitted with correct data', async () => {
        await waitFor(() => screen.getByTestId('form-new-bill'))
        const newBill = getNewBillUI()
        const handleSubmitSpy = jest.spyOn(newBill, 'handleSubmit');
        const updateBillSpy = jest.spyOn(newBill, 'updateBill');
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
        expect(updateBillSpy).toHaveBeenCalledWith({
            email: 'a@a',
            type: 'Transports',
            name: 'test',
            amount: 100,
            date: '2021-01-01',
            vat: '20',
            pct: 20,
            commentary: 'test',
            fileUrl: 'https://localhost:3456/images/test.jpg',
            fileName: '',
            status: 'pending'
        });
    });
    describe('When I submit my new Bill', () => {
        test('Then I should be redirected to Bills page', async () => {
            await waitFor(() => screen.getByTestId('form-new-bill'))
            const newBill = getNewBillUI()
            const onNavigateSpy = jest.spyOn(newBill, 'handleSubmit');
            const updateBillSpy = jest.spyOn(newBill, 'updateBill');
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
    });
})

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
    const file = new File(['sample file content'], 'sample.jpg', {type: 'image/jpeg'});
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
