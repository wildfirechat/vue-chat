import HomePage from './ui/main/HomePage'
import LoginPage from './ui/main/LoginPage'
import ConversationPage from './ui/main/ConversationPage'
import ContactPage from './ui/main/ContactPage'
import SettingPage from './ui/main/SettingPage'
import Single from "@/ui/voip/Single";
import Multi from "@/ui/voip/Multi";
import FileRecordPage from "@/ui/fileRecord/FileRecordPage";
import FavPage from "@/ui/main/fav/FavPage";
import WorkspacePage from "./ui/workspace/WorkspacePage";

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
                path: 'fav',
                name: 'fav',
                component: FavPage,
            },
            {
                path: 'setting',
                name: 'setting',
                component: SettingPage,
            },
        ]
    },
    {
        name: 'voip-single',
        path: '/voip/single',
        component: Single,
    },
    {
        name: 'voip-multi',
        path: '/voip/multi',
        component: Multi,
    },
    {
        name: 'files',
        path: '/files',
        component: FileRecordPage,
    },
    {
        name: 'workspace',
        path: '/workspace',
        component: WorkspacePage,
    }
    // {
    //     name: 'voip-conference',
    //     path: '/voip/conference',
    //     component: Conference,
    // },

]
export default routers
