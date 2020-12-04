import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import ConversationPage from './components/ConversationPage'
import ContactPage from './components/ContactPage'
import SettingPage from './components/SettingPage'

const routers = [
    {
        path: '/',
        component: LoginPage
    },
    {
        path: '/home',
        component: HomePage,
        children: [
            {
                path: '/',
                name: 'conversation',
                component: ConversationPage,
            },
            {
                path: 'contact',
                name: 'contact',
                component: ContactPage,
            },
            {
                path: 'setting',
                name: 'setting',
                component: SettingPage,
            }
        ]

    },
]
export default routers
