
<script setup>
import { userDetail, fetchTransactionOrUser, fetchUserCredit, fetchUser, fetchAllCredit, fetchCycle} from '@/service/Api';
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const user = ref(null);
const loading = ref(true);
const router = useRouter();
const transactions = ref([])
const filterType = ref("");
const filterDate = ref("");
const credits = ref([]);
const users = ref([]);
const allCreditsUser = ref([]);


const currentCycle = ref(null);
const cycleProgress = ref(0);

const editingCycle = ref({});
const isDialogVisible = ref(false);
const cycles = ref([]);



onMounted(async() => {
  await fetchedCreditUser();
  await fetchedUserDetail();
  await fetchedTransaction();
  await fetchCurrentCycle();

 
});



const filterTransactions = computed(() => {
  return transactions.value.filter(tx => {
    let matchType = !filterType.value || tx.transaction_type === filterType.value;
    let matchDate = !filterDate.value || 
      new Date(tx.created_at).toISOString().slice(0,10) === filterDate.value;
      return matchType && matchDate;
  });
});

function toDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d; // On retourne bien un objet Date
}

async function fetchCurrentCycle() {
  try {
  
    const response = await fetchCycle();
    cycles.value = response || [];
   

    const todayDate = toDateOnly(new Date());
   
    currentCycle.value = cycles.value.find(c => {
      const start = toDateOnly(c.start_date);
      const end = toDateOnly(c.end_date);
      return start <= todayDate && todayDate <= end && c.is_active;
    });

    if (currentCycle.value) {
      const start = toDateOnly(currentCycle.value.start_date);
      const end = toDateOnly(currentCycle.value.end_date);

      const totalDuration = end - start;   // durée totale
      const elapsed = todayDate - start;   // jours écoulés

      cycleProgress.value = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
    } else {
      cycleProgress.value = 0;
    }
  } catch (error) {
    console.error(' Erreur lors du fetch du cycle :', error);
  }
}


async function fetchedCreditUser(){

  try{
    const userId = localStorage.getItem('id');
    const response =(await fetchUserCredit(userId)).filter(c => !c.is_paid);
    const allCredits = await fetchAllCredit();
    allCreditsUser.value = allCredits;
    credits.value = response;
    console.log("credit user ", response)
  }catch(error){
    console.error('erreur lors de la recuperation du credit user', error);
    throw error;
  }
}

async function fetchedUserDetail(){
   
    try{
        const userId = localStorage.getItem('id');
        const response = await userDetail(userId);
        const allUser = await fetchUser();
        users.value = allUser;
        user.value =response;
    } catch(error){
         console.error("Erreur lors du chargement de l'utilisateur :", error);
    } finally{
        loading.value = false;
    }
}
 function formatUSD(value) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(value);
}
const creditStats = computed(() => {
  let totalPrincilal = 0;
  let totalDue = 0;
  let totalBalanceDue =0;
  let allTotalPrincilal = 0
  let balenceUsers = 0;
  
  credits.value.forEach(c => {
    totalPrincilal += Number(c.princilal || 0);
    totalDue += Number(c.total_due || 0);
    totalBalanceDue += Number(c.balance_due || 0);
  });

  allCreditsUser.value.forEach(cp => {
      allTotalPrincilal += Number(cp.princilal || 0);
  })
  users.value.forEach(us => {
      balenceUsers += Number(us.balance || 0);
  }) 
  

  let totalInteret = (allTotalPrincilal *10)/100;
  let totalDime = (totalInteret *10)/100;
  let restIntert = totalInteret - totalDime;
  let interUser =( user.value.balance * restIntert)/balenceUsers

  return {
    totalPrincilal,
    totalDue,
    totalBalanceDue,
    allTotalPrincilal,
    interUser:formatUSD(interUser),
  }
});



async function fetchedTransaction(){
  const userId = localStorage.getItem('id');
  try{
    const response = await fetchTransactionOrUser(userId);
    transactions.value = response
    console.log('transaction pour cette utilisateur', transactions.value);

  } catch(error){
    console.error('error to fetching transaction');
    throw error;
  }
}

function formatLabel(key) {
  return key.replace(/_/g, ' ');
}

function formatValue(key, value) {
  if (key === 'date_joined') return new Date(value).toLocaleDateString();
  return value ?? '-';
}

</script>

<template>
 <div>
    <div class="p-6 space-y-6">
      <!-- Bouton retour -->
     <div class="flex items-center justify-between">
 
        <h1 v-if="user" class="text-2xl font-bold text-gray-700"> {{ user.first_name }} {{ user.last_name }} </h1>
     
      </div>
      <!-- Statistiques utilisateur -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


        <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Épargne</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{formatUSD(user.balance ?? 0 )}}</p>
            <span class="text-orange-500 text-sm"></span>
          </div>
          <div class="bg-orange-100 dark:bg-green-500 p-3 rounded-full">
            <i class="pi pi-wallet text-blue-500 text-xl"></i>
          </div>
        </div>

        <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Sociale</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${{ user.social ?? 0 }}</p>
            <span class="text-orange-500 text-sm"></span>
          </div>
          <div class="bg-orange-100 dark:bg-orange-700/20 p-3 rounded-full">
            <i class="pi pi-dollar text-orange-500 text-xl"></i>
          </div>
        </div>

        <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total Crédits</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ formatUSD(creditStats.totalPrincilal) }}
            </p>
            <span class="text-blue-500 text-sm">Montant contracté</span>
          </div>
          <div class="bg-blue-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-credit-card text-blue-500 text-xl"></i>
          </div>
        </div>

        <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p class="text-gray-500 text-sm">Total à rembourser</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            ${{ creditStats.totalDue }}
          </p>
          <span class="text-red-500 text-sm">Avec intérêts (10%)</span>
        </div>
        <div class="bg-red-100 dark:bg-red-700/20 p-3 rounded-full">
          <i class="pi pi-percentage text-red-500 text-xl"></i>
        </div>
      </div>

       <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p class="text-gray-500 text-sm">Montant restant à payer</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            ${{ creditStats.totalBalanceDue }}
          </p>
         
        </div>
        <div class="bg-green-500 dark:bg-blue-700/20 p-3 rounded-full">
          <i class="pi pi-chart-line text-green-950 text-xl"></i>
        </div>
      </div>

      <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p class="text-gray-500 text-sm"> interêt</p>
          <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {{ formatUSD(user.total_interest_user)}}
          </p>
         
        </div>
        <div class="bg-green-500 dark:bg-blue-700/20 p-3 rounded-full">
          <i class="pi pi-percentage text-green-950 text-xl"></i>
        </div>
      </div>

      </div>

      <!-- Carte détails utilisateur -->

    </div>



<div class="my-6"></div> 
        <div v-if="currentCycle">
      <h2 class="text-xl font-bold text-gray-700">
        Cycle en cours : {{ currentCycle.name }}
      </h2>
      <p class="text-sm text-gray-500">
        Du {{ new Date(currentCycle.start_date).toLocaleDateString() }}
        au {{ new Date(currentCycle.end_date).toLocaleDateString() }}
      </p>

      <!-- Barre de progression PrimeVue -->
      <ProgressBar :value="cycleProgress" showValue class="mt-3" />
    </div>
    <div v-else>
      <p class="text-gray-500 italic">⚠️ Aucun cycle en cours</p>
    </div>
 </div>

</template>


