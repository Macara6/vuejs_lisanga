<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import AppMenuItem from './AppMenuItem.vue';



// Réactif et initialisé depuis localStorage


// Sync si la clé change dans un autre onglet (optionnel)
const isSuperUser = localStorage.getItem('is_superuser') === 'true';



const model = computed(() => {
  if (isSuperUser) {
    return [
      {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/pages/Accueil' }]
      },
      {
        label: 'Gestions',
        items: [
          {
            label: 'Utilisateurs',
            icon: 'pi pi-users',
            items: [
              { label: 'Membres', icon: 'pi pi-user-plus', to: '/pages/Membres' },
              { label: 'Suppléant', icon: 'pi pi-sitemap', to: '/pages/Suppleants' }
            ]
          },
          {
            label: 'Transactions',
            icon: 'pi pi-sort-alt',
            items: [
              { label: 'Dépôt', icon: 'pi pi-wallet', to: '/pages/Deposit' },
              { label: 'Retrait', icon: 'pi pi-minus-circle', to: '/pages/Retrait' },
              { label: 'Sociale', icon: 'pi pi-wave-pulse', to: '/pages/DepositSocial' },
              { label: 'Crédit', icon: 'pi pi-building-columns', to: '/pages/CreateCredit' },
              { label: 'Remboursement', icon: 'pi pi-calculator', to: '/pages/Remboursement' }
            ]
          },
          { label: 'Historiques transactions', icon: 'pi pi-history', to: '/pages/Historiques' },
          { label: 'Liste crédits', icon: 'pi pi-clipboard', to: '/pages/HistoriqueCredit' },
          { label: 'Histo Crédit & Rembou', icon: 'pi pi-undo', to: '/pages/CreditRemboursement' },
          //{ label:'Liste bon de sortie', icon:'pi pi-list', to:'/pages/CashOutListe'},
          //{label:'Bon de sortie ', icon:'pi pi-arrow-down-left', to:'/pages/CreateCashout'},
          {label:"Mon compte", icon:'pi pi-user', to:'/pages/ProfileUser'},
        ]
      }
    ];
  } else {
    return [
      {
        label:'Home',
        items:[
            {
             label:'Dashboard',
             icon:'pi pi-fw pi-home',
             to:'/pages/AccueilUser'
            },
            {label:'Histo Transactions', icon:'pi pi-history', to:'/pages/HistoTransactionUser'},
            { label: 'Histo Crédit & Rembou', icon: 'pi pi-undo', to: '/pages/CreditRemboursement' },
             { label: 'Liste crédits', icon: 'pi pi-clipboard', to: '/pages/HistoriqueCredit' },
            {label:"Envoi épargne", icon:'pi pi-arrow-up-right', to:'/pages/SendMoney'},

            {label:"Mon compte", icon:'pi pi-user', to:'/pages/ProfileUser'},

        ]
 
      }
    ];
  }
});
</script>

<template>
  <ul class="layout-menu">
    <app-menu-item v-for="(item, i) in model" :key="i" :item="item" :index="i" />
  </ul>
</template>