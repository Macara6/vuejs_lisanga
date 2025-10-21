
<script setup>
import { userDetail, fetchTransactionOrUser, fetchUserCredit, fetchUser, fetchAllCredit } from '@/service/Api';
import { all } from 'axios';
import Dropdown from 'primevue/dropdown';
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


onMounted(async() => {
  await fetchedCreditUser();
  await fetchedUserDetail();
  await fetchedTransaction();

 
});



const filterTransactions = computed(() => {
  return transactions.value.filter(tx => {
    let matchType = !filterType.value || tx.transaction_type === filterType.value;
    let matchDate = !filterDate.value || 
      new Date(tx.created_at).toISOString().slice(0,10) === filterDate.value;
      return matchType && matchDate;
  });
});


async function fetchedCreditUser(){

  try{
    const userId = route.params.id;
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
        const userId = route.params.id;
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
      allTotalPrincilal += Number(cp.total_due || 0);
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




function goBack() {
  router.push({ name: 'Membres' }); 
}
async function fetchedTransaction(){
  const userId = route.params.id;
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
        <Button 
          label="Retour" 
          icon="pi pi-arrow-left" 
          severity="secondary" 
          class="mb-4"
          @click="goBack"
        />
        <h1 class="text-2xl font-bold text-gray-700">Détails du membre</h1>
        <i class="pi pi-user text-blue-500 text-3xl"></i>
      </div>

      <!-- Statistiques utilisateur -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


        <div v-if="user" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Épargne</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">${{ user.balance ?? 0 }}</p>
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
              ${{ creditStats.totalPrincilal }}
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
            {{formatUSD(user.total_interest_user)}}
          </p>
         
        </div>
        <div class="bg-green-500 dark:bg-blue-700/20 p-3 rounded-full">
          <i class="pi pi-percentage text-green-950 text-xl"></i>
        </div>
      </div>

      </div>

      <!-- Carte détails utilisateur -->

    </div>

  <div class="p-6 space-y-6">
  <!-- Cartes et informations utilisateur ici -->

  <!-- Historique des transactions -->
  <Card class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
    <template #title>
      <h2 class="text-xl font-bold text-gray-700 dark:text-gray-100">
        📜 Historique des transactions
      </h2>
    </template>

    <template #content>
      <div v-if="transactions.length === 0" class="text-gray-500 text-center py-6">
        <i class="pi pi-inbox text-2xl"></i>
        <p>Aucune transaction trouvée pour cet utilisateur.</p>
      </div>

      <div v-else class="flex flex-col">
        <!-- Filtres -->
        <div class="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label class="block text-sm text-gray-500 mb-1">Type</label>
            <Dropdown 
              v-model="filterType" 
              :options="[
                { label: 'Tous', value: '' },
                { label: 'Dépôt', value: 'DEPOT' },
                { label: 'Retrait', value: 'RETRAIT' },
                { label:  'Sociale', value :'SOCIALE'}
              ]" 
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrer par type"
              class="w-40"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-500 mb-1">Date</label>
            <input type="date" v-model="filterDate" class="border rounded px-2 py-1"/>
          </div>
        </div>

        <!-- Table scrollable -->
        <div class="overflow-y-auto" style="max-height: 500px;">
          <DataTable 
            :value="filterTransactions"
            scrollable
            scrollHeight="300px"
            class="min-w-full"
          >
            <Column field="id" header="ID" style="min-width: 80px"></Column>
            <Column field="type" header="Type" style="min-width: 120px">
              <template #body="{ data }">
                <span :class="data.type === 'deposit' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                  {{ data.transaction_type }}
                </span>
              </template>
            </Column>
            <Column field="amount" header="Montant" style="min-width: 150px">
              <template #body="{ data }">
                ${{ data.amount }}
              </template>
            </Column>
            <Column field="reference" header="Référence" style="min-width: 180px"></Column>
            <Column field="balance_after" header="Solde après" style="min-width: 150px">
              <template #body="{ data }">
                ${{ data.balance_after }}
              </template>
            </Column>
            <Column field="created_at" header="Date" style="min-width: 200px">
              <template #body="{ data }">
                {{ new Date(data.created_at).toLocaleString() }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </template>
  </Card>
</div>


<div class="my-6"></div> 
<div>
    <Card class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <template #content>
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <i class="pi pi-spin pi-spinner text-3xl text-gray-400"></i>
            <p class="text-gray-500 mt-2">Chargement des informations...</p>
          </div>

          <div v-else-if="user" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="(value, key) in user" :key="key" class="flex flex-col">
              <span class="text-sm text-gray-400 capitalize">{{ formatLabel(key) }}</span>
              <span class="font-medium text-gray-700 dark:text-gray-200">
                {{ formatValue(key, value) }}
              </span>
            </div>

            <div class="md:col-span-2">
              <span class="text-sm text-gray-400">Suppléant</span>
              <span class="font-medium text-gray-700 dark:text-gray-200">
                {{ user.substitute_name }} 
              </span>
            </div>
          </div>

          <div v-else class="text-red-500 text-center py-4">
            <i class="pi pi-exclamation-triangle"></i>
            <p>Utilisateur non trouvé.</p>
          </div>
        </template>
      </Card>
      </div>
 </div>
</template>


