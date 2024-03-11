/**
 * @jest-environment jsdom
 */

import mockStore from '../__mocks__/store'
import {screen, waitFor} from '@testing-library/dom'
import BillsUI from '../views/BillsUI.js'
import {bills} from '../fixtures/bills'
import {ROUTES, ROUTES_PATH} from '../constants/routes';
import {localStorageMock} from '../__mocks__/localStorage.js';
import router from '../app/Router';
import Bills from '../containers/Bills';
import userEvent from '@testing-library/user-event';


jest.mock("../app/store", () => mockStore);

describe('Given I am connected as an employee', () => {
    describe('When I am on Bills Page', () => {
        test('Then bill icon in vertical layout should be highlighted', async () => {
            Object.defineProperty(window, 'localStorage', {value: localStorageMock})
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }))
            const root = document.createElement('div')
            root.setAttribute('id', 'root')
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.Bills)
            await waitFor(() => screen.getByTestId('icon-window'))
            const windowIcon = screen.getByTestId('icon-window')
            expect(windowIcon.className).toBe('active-icon')
        })
        test('Then bills should be ordered from earliest to latest', () => {
            document.body.innerHTML = BillsUI({data: bills})
            const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
            const antiChrono = (a, b) => ((a < b) ? 1 : -1)
            const datesSorted = [...dates].sort(antiChrono)
            expect(dates).toEqual(datesSorted)
        })
        test('Then bills row should display an eye icon', () => {
            document.body.innerHTML = BillsUI({data: bills})
            const rowEyes = screen.getAllByTestId('icon-eye')
            expect(rowEyes.length).toBe(bills.length)
        })
        test('Then clickable eye displays picture in modal', () => {
            Object.defineProperty(window, 'localStorage', {value: localStorageMock})
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }))
            document.body.innerHTML = BillsUI({data: [{...bills[0]}]});
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({pathname});
            };
            const store = null;
            const bill = new Bills({
                document,
                onNavigate,
                store,
                localStorage: window.localStorage,
            });
            const eyeDiv = screen.getByTestId('icon-eye')
            const handleClickOnEye = jest.fn(bill.handleClickIconEye(eyeDiv))
            eyeDiv.addEventListener('click', handleClickOnEye)
            userEvent.click(eyeDiv)
            expect(handleClickOnEye).toHaveBeenCalled()
            const modal = screen.getByTestId('modalFile')
            expect(modal).toBeTruthy()
        })
        test('the new Bills button must be active', () => {
            Object.defineProperty(window, 'localStorage', {value: localStorageMock})
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }))
            document.body.innerHTML = BillsUI({data: [{...bills[0]}]});
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({pathname});
            };
            const store = null;
            const bill = new Bills({
                document,
                onNavigate,
                store,
                localStorage: window.localStorage,
            });
            const handleNewBillClick = jest.fn(bill.handleClickNewBill)
            const newBillButton = screen.getByTestId('btn-new-bill')
            expect(newBillButton).toBeDefined()
            newBillButton.addEventListener('click', handleNewBillClick)
            userEvent.click(newBillButton)
            expect(handleNewBillClick).toHaveBeenCalled()
        })

    })
})
describe('When I navigate to Bills Page', () => {
    beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
            type: 'Employee',
            email: "mario@bros.fr"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
    })
    test('fetches bills from mock API GET', async () => {
        window.onNavigate(ROUTES_PATH.Bills);
        await waitFor(() => screen.getByText('Mes notes de frais'));
        const billsTableRows = screen.getByTestId('tbody');
        expect(billsTableRows).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
        test('fetches bills from an API and fails with 404 message error', async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error("Erreur 404"))
                    }
                }
            })
            window.onNavigate(ROUTES_PATH.Bills);
            await new Promise(process.nextTick);
            const message = screen.getByText(/Erreur 404/);
            expect(message).toBeTruthy();
        });

        test('fetches messages from an API and fails with 500 message error', async () => {
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    list: () => {
                        return Promise.reject(new Error('Erreur 500'));
                    },
                };
            });

            window.onNavigate(ROUTES_PATH.Bills);
            await new Promise(process.nextTick);
            const message = screen.getByText(/Erreur 500/);
            expect(message).toBeTruthy();
        });
    })
});
