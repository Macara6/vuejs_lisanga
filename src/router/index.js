import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/home',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path:'/pages/Membres',
                    name:'Membres',
                    component: () => import('@/views/pages/Membres.vue')
                },

                {
                    path:'/user/:id',
                    name:'userDetail',
                    component: () => import('@/views/pages/userDetail.vue')
                },
                {
                    path:'/pages/Deposit',
                    name:'Deposit',
                    component:() => import('@/views/pages/Deposit.vue')
                },
                {
                    path:'/pages/DepositSocial',
                    name:'DepositSocial',
                    component:()=>  import('@/views/pages/DepositSocial.vue'),
                },
                {
                    path:'/pages/Historiques',
                    name:'Historiques',
                    component:() => import('@/views/pages/Historiques.vue')
                },
    
                {
                    path:'/pages/Retrait',
                    name:'retrait',
                    component:() => import('@/views/pages/Retrait.vue')
                },

                {
                    path:'/pages/Suppleants',
                    name:'Suppleants',
                    component: () => import('@/views/pages/Suppleants.vue')
                },
                {
                    path:'/pages/CreateCredit',
                    name :'CreateCredit',
                    component:() => import('@/views/pages/CreateCredit.vue')
                },
                {
                    path:'/pages/Remboursement',
                    name:'Remboursement',
                    component:() => import('@/views/pages/Remboursement.vue')
                },
                {
                    path:'/pages/HistoriqueCredit',
                    name:'HistoriqueCredit',
                    component:() => import('@/views/pages/HistoriqueCredit.vue')
                },
                {
                    path:'/pages/CreditRemboursement',
                    name:'CreditRemboursement',
                    component:() => import('@/views/pages/CreditRemboursement.vue')
                },
                {
                    path:'/pages/Accueil',
                    name:'Accueil',
                    component:() => import('@/views/pages/Accueil.vue')
                },
                {
                    path:'/pages/AccueilUser',
                    name:'AcceuilUser',
                    component:() => import('@/views/pages/AccueilUser.vue')
                },
                {
                    path:'/pages/SendMoney',
                    name:'SendMoney',
                    component:() => import('@/views/pages/SendMoney.vue')
                },
                {
                    path:'/pages/CreateCashout',
                    name:'CreateCashout',
                    component:() => import('@/views/pages/CreateCashout.vue')
                },
                {
                    path:'/pages/CashOutListe',
                    name:'CashOutListe',
                    component:() => import('@/views/pages/CashOutListe.vue')
                },
                {
                    path:'/pages/HistoTransactionUser',
                    name:'HistoTransactionUser',
                    component:() => import('@/views/pages/HistoTransactionUser.vue')
                },
                {
                    path:'/pages/ProfileUser',
                    name:'ProfileUser',
                    component:() => import('@/views/pages/ProfileUser.vue')
                },

                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        {
            path: '/',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path:'/pages/SetPassword',
            name:'SetPassword',
            component:() =>import('@/views/pages/SetPassword.vue')
        },
        {
            path: '/londing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

 
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

export default router;
