import HomePage from './ui/components/HomePage'
import LoginPage from './ui/components/LoginPage'
import ConversationPage from './ui/components/ConversationPage'
import ContactPage from './ui/components/ContactPage'
import SettingPage from './ui/components/SettingPage'
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
