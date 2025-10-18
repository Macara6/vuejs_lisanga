

<script setup>
 import { fetchUser, fetchAllCredit, fetchHistoriqueTransaction,fetchCashout, fetchCycle, updateCycle} from '@/service/Api';
import { all } from 'axios';
 import { computed, onMounted, ref } from 'vue';

 const users = ref([]);
 const credits = ref([]);
 const creditAllPaid = ref([]);
 const allUserBalance = ref([]);
 const  histoTransaction = ref([]);
 const cashoutList = ref([]);
const userName = localStorage.getItem('username')
const currentCycle = ref(null);
const cycleProgress = ref(0);

const editingCycle = ref({});
const isDialogVisible = ref(false);

const cycles = ref([]);

 onMounted(async() => {
    await fechedUsers();
    await fetchCurrentCycle();
 })

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


 async function fechedUsers(){
    try{
        const response = await fetchUser();
        const currentUser = localStorage.getItem('is_superuser');
        users.value = response.filter(user => user.id !=currentUser);
        const allcredits = await fetchAllCredit();
        const creditsPaid = (await fetchAllCredit()).filter(c => c.is_paid);
        const allUserOrBalance = (await fetchUser()).filter(cb => cb.balance !=0);
        const transaction = (await fetchHistoriqueTransaction()).filter(ts => ts.transaction_type =='RETRAIT');
        const cashouts = await fetchCashout();
        cashoutList.value = cashouts;
        histoTransaction.value = transaction;
        allUserBalance.value = allUserOrBalance;
        creditAllPaid.value = creditsPaid
        credits.value = allcredits;
    
       
    }catch(error){
        console.error('erreur for fetching user', error);
    }
 }

 function formatUSD(value) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(value);
}
 const usersBalance = computed(() => {

    let totalBalance = 0;
    let totalSocial = 0;
    let totalprincilal =0;
    let totalDue = 0;
    let creditsPaid = 0;
    let totalRetrait = 0;
    let totalCashout=0;

    users.value.forEach(u =>{
        totalBalance +=Number(u.balance || 0);
        totalSocial +=Number(u.social|| 0);
    });

    credits.value.forEach(c => {
        totalprincilal += Number(c.princilal || 0);
        totalDue += Number(c.total_due || 0);
    });
    
    creditAllPaid.value.forEach(cp => {
         creditsPaid += Number(cp.total_due || 0);
    })
    histoTransaction.value.forEach(histp  => {
        totalRetrait += Number(histp.amount || 0);
    })
    cashoutList.value.forEach(am => {
      totalCashout += Number(am.total_amount || 0);
    })

    let creditNotPaid = totalDue - creditsPaid;
    let totalInteret = (totalprincilal * 10)/100; 
    let totalDime = (totalInteret *10)/100;
    let restInteret = totalInteret - totalDime;
    
    return {
        totalBalance:formatUSD(totalBalance),
        totalSocial:formatUSD(totalSocial),
        totalprincilal:formatUSD(totalprincilal),
        totalDue:formatUSD(totalDue),
        creditsPaid:formatUSD(creditsPaid),
        creditNotPaid:formatUSD(creditNotPaid),
        totalInteret:formatUSD(totalInteret),
        totalDime:formatUSD(totalDime),
        restInteret:formatUSD(restInteret),
        totalRetrait:formatUSD(totalRetrait),
        totalCashout:formatUSD(totalCashout)
    }
 });


</script>
<template>
    <div>
        <div class="p-6 space-y-6">
      <!-- Bouton retour -->
      <div class="flex items-center justify-between">

        <h1 class="text-2xl font-bold text-gray-700">{{ userName }} <i class="pi pi-verified text-blue-500 text-3xl"></i> </h1>
        <i class="pi pi-building text-blue-500 text-3xl"></i>
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
            <p class="text-gray-500 text-sm"> Déjà rembourser</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ usersBalance.creditsPaid }} 
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
            <p class="text-gray-500 text-sm"> Total sotrie</p>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {{ usersBalance.totalCashout }}
            </p>
            <span class="text-red-500 text-sm">  </span>
          </div>
          <div class="bg-green-100 dark:bg-blue-700/20 p-3 rounded-full">
            <i class="pi pi-star-half text-blue-500 text-xl"></i>
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