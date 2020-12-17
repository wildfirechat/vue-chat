import HomePage from './ui/main/HomePage'
import LoginPage from './ui/main/LoginPage'
import ConversationPage from './ui/main/ConversationPage'
import ContactPage from './ui/main/ContactPage'
import SettingPage from './ui/main/SettingPage'
import Single from "@/ui/voip/Single";

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
    {
        name:'voip',
        path: '/voip',
        component: Single,
    }
]
export default routers
