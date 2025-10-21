

<script setup>
 import { fetchUser, fetchAllCredit, fetchHistoriqueTransaction,fetchAllTransactionCredit, fetchCycle, updateCycle, cancelCreditTransaction} from '@/service/Api';
 import { computed, onMounted, ref } from 'vue';

 const users = ref([]);
 const credits = ref([]);
 const creditAllPaid = ref([]);
 const allUserBalance = ref([]);
 const  histoTransaction = ref([]);
 const creditTransactions = ref([]);
 const cashoutList = ref([]);
const userName = localStorage.getItem('username')
const currentCycle = ref(null);
const cycleProgress = ref(0);

const editingCycle = ref({});
const isDialogVisible = ref(false);
const loading = ref(false); 

const cycles = ref([]);



onMounted(async () => {
  const cached = localStorage.getItem('dashboard_cache');
  if (cached) {
    const parsed = JSON.parse(cached);
    users.value = parsed.users;
    credits.value = parsed.credits;
  }

  await Promise.all([fechedUsers(), fetchCurrentCycle()]);
  localStorage.setItem('dashboard_cache', JSON.stringify({ users: users.value, credits: credits.value }));
});

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString();
}

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


function openEditDialog() {
  editingCycle.value = { ...currentCycle.value };
  isDialogVisible.value = true;
}


async function saveCycleUpdate(){
  try{
    if (!editingCycle.value?.id) return;
    const updated = await updateCycle(editingCycle.value.id, editingCycle.value);
    console.log("Cycle mis à jour :", updated);

    currentCycle.value = updated;
    isDialogVisible.value = false;
    await fetchCurrentCycle();
  }catch(error){
    console.error("Erreur lors de la mise à jour du cycle :", error);
  }
}




 async function fechedUsers() {
  try {
    const [
      usersRes,
      allCreditsRes,
      historiqueRes,
      allTransacCreditRes
    ] = await Promise.all([
      fetchUser(),
      fetchAllCredit(),
      fetchHistoriqueTransaction(),
      fetchAllTransactionCredit(),
    ]);

    const currentUserId = Number(localStorage.getItem('id'));

    // Nettoyage des données
    users.value = usersRes.filter(u => !u.is_superuser && u.id !== currentUserId);
    credits.value = allCreditsRes.filter(c => c.princilal > 0); // ⚡ exclut les crédits à 0
    creditAllPaid.value = allCreditsRes.filter(c => c.is_paid);
    histoTransaction.value = historiqueRes.filter(ts => ts.transaction_type === 'RETRAIT');
    creditTransactions.value = allTransacCreditRes.filter(ct => ct.transaction_type === 'REMBOURSEMENT');

    allUserBalance.value = usersRes.filter(u => u.balance !=0);

    console.log('✅ Données chargées avec succès');
  } catch (error) {
    console.error("Erreur lors du chargement :", error);
  }
}


 function formatUSD(value) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(value);
}

const usersBalance = computed(() => {
  const total = {
    balance: 0,
    social: 0,
    principal: 0,
    due: 0,
    duePaid: 0,
    paid: 0,
    creditNotPaid: 0,
    retrait: 0,
    remboursement: 0,
  };

  users.value.forEach(u => {
    total.balance += Number(u.balance || 0);
    total.social += Number(u.social || 0);
  });

  credits.value.forEach(c => {
    const principal = Number(c.princilal || 0);
    const due = Number(c.total_due || 0);
    const balance = Number(c.balance_due || 0);

    total.principal += principal;
    total.due += due;
    total.paid += due - balance;

    if (c.is_paid) total.duePaid += due;
    

  });
  histoTransaction.value.forEach(h => total.retrait += Number(h.amount || 0));
  creditTransactions.value.forEach(ct => total.remboursement += Number(ct.amount || 0));
  
  total.creditNotPaid = credits.value
  .filter(c => !c.is_paid)
  .reduce((sum, c) => sum + Number(c.balance_due || 0), 0);



  const interet = (total.principal * 10) / 100;
  const dime = (interet * 10) / 100;
  const restInteret = interet - dime;

  return {
    totalBalance: formatUSD(total.balance),
    totalSocial: formatUSD(total.social),
    totalprincilal: formatUSD(total.principal),
    totalDue: formatUSD(total.due),
    totalDuePaid: formatUSD(total.duePaid),
    creditsPaid: formatUSD(total.paid),
    creditNotPaid: formatUSD(total.creditNotPaid),
    totalRetrait: formatUSD(total.retrait),
    rebourser: formatUSD(total.remboursement),
    totalInteret: formatUSD(interet),
    totalDime: formatUSD(dime),
    restInteret: formatUSD(restInteret),
  };
});

const totalCredits = computed(() => credits.value.length);
const paidCreditsCount = computed(() =>
  credits.value.filter(c => c.is_paid).length
);



</script>

<template>
    <div>
        <div class="p-6 space-y-6">
      <!-- Bouton retour -->   

      <div class="flex items-center justify-between">

        <h1 class="text-2xl font-bold text-gray-700">{{ userName }} 
          <i class="pi pi-verified text-blue-500 text-3xl"></i> </h1>
        <i class="pi pi-building text-blue-500 text-3xl"></i>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ProgressSpinner style="width: 60px; height: 60px" strokeWidth="5" />
        <p class="text-gray-500 text-lg">Chargement des données...</p>
      </div>

      <!-- Statistiques utilisateur -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total Épargne</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ usersBalance.totalBalance }} </p>
            <span class="text-green-500 text-sm">Pour {{ allUserBalance.length }} Membres sur {{ users.length }}</span>
          </div>
          <div class="bg-blue-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-wallet text-green-500 text-xl"></i>
          </div>
        </div>

        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> Total retrait </p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ usersBalance.totalRetrait }}
            </p>
            <span class="text-red-500 text-sm">  </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-download text-blue-500 text-xl"></i>
          </div>
        </div>


        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total sociale</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ usersBalance.totalSocial }} </p>
            
          </div>
          <div class="bg-orange-100 dark:bg-green-500 p-3 rounded-full">
            <i class="pi pi-thumbs-up text-green-500 text-xl"></i>
          </div>
        </div>

        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total credits</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ usersBalance.totalprincilal }}</p>
            <span class="text-blue-500 text-sm">Montant contracté</span>
          </div>
          <div class="bg-orange-100 dark:bg-orange-700/20 p-3 rounded-full">
            <i class="pi pi-arrow-down-right text-red-500 text-xl"></i>
          </div>
        </div>

        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total à rembourser</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ usersBalance.totalDue }}
            </p>
            <span class="text-red-500 text-sm">Avec intérêts de 10%</span>
          </div>
          <div class="bg-blue-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-chart-line text-blue-500 text-xl"></i>
          </div>
        </div>

        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> Total crédits complètement payés </p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ paidCreditsCount }} 
            </p>
            <span class="text-red-500 text-sm">sur {{ totalCredits }} </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-arrow-up-right text-blue-500 text-xl"></i>
          </div>
        </div>


        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> déjà rembourser </p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ usersBalance.rebourser }} 
            </p>
            <span class="text-red-500 text-sm">sur {{ usersBalance.totalDue }} </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-arrow-up-right text-blue-500 text-xl"></i>
          </div>
        </div>


        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> Reste à rembourser</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
             {{ usersBalance.creditNotPaid }}
            </p>
            <span class="text-red-500 text-sm">sur {{ usersBalance.totalDue }} </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-wave-pulse text-blue-500 text-xl"></i>
          </div>
        </div>



        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> Total Intérêts</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
               {{ usersBalance.totalInteret }}
            </p>
            <span class="text-red-500 text-sm">reste intérêt après dîme
                {{ usersBalance.restInteret }}</span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-percentage text-blue-500 text-xl"></i>
          </div>
        </div>

        <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> Dîme</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ usersBalance.totalDime }}
            </p>
            <span class="text-red-500 text-sm">  </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-envelope text-blue-500 text-xl"></i>
          </div>
        </div>

                <div  class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm"> Total Membres</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ users.length }}
            </p>
            <span class="text-red-500 text-sm">  </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-users text-blue-500 text-xl"></i>
          </div>
        </div>


      </div>



  <div class="p-6 space-y-6">
    <!-- Vérifie si un cycle est en cours -->
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
    <Button label="✏️ Modifier le cycle" icon="pi pi-pencil" class="mt-4 p-button-primary"
      @click="openEditDialog" />
  </div>

      <!-- dialogue pour le modification du cycle -->
      <Dialog v-model:visible="isDialogVisible" modal header="Modifier le cycle" :style="{ width: '400px' }">
      <div class="p-fluid">
        <div class="field mb-3">
          <label for="name">Nom</label>
          <InputText id="name" v-model="editingCycle.name" />
        </div>

        <div class="field mb-3">
          <label for="start_date">Date de début</label>
          <InputText id="start_date" type="date" v-model="editingCycle.start_date" />
        </div>

        <div class="field mb-3">
          <label for="end_date">Date de fin</label>
          <InputText id="end_date" type="date" v-model="editingCycle.end_date" />
        </div>

        <div class="field-checkbox mb-3">
          <Checkbox v-model="editingCycle.is_active" :binary="true" />
          <label>Actif</label>
        </div>
      </div>

      <template #footer>
        <Button label="❌ Annuler" class="p-button-text" @click="isDialogVisible = false" />
        <Button label="💾 Sauvegarder" class="p-button-success" @click="saveCycleUpdate" />
      </template>
    </Dialog>
    </div>
    </div>
</template>



<style scoped>
.field {
  display: flex;
  flex-direction: column;
}
</style>