
<script setup>
    import { sendMoney, fetchUser } from '@/service/Api';
    import { ref, reactive} from 'vue';
    import { useToast } from "primevue/usetoast";

    const step = ref(1);
    const matricule = ref("");
    const toast = useToast();
    const amount = ref("");
    const targetUser = ref({});
    const errors = reactive({});
    const loading = ref(false);
    const transactionSummary = ref(null);



async function checkMatricule(){
    errors.matricule = null;
    targetUser.value =null;
    if(!matricule.value){
        errors.matricule = ['le matricule est requis'];
        console.log('salur suivant')
        return false;
    }
    try{
        const users = await fetchUser();
        const user = users.find(u => u.matricule === matricule.value.trim());
        if(!user){
            errors.matricule =['utilisateur introuvable avec ce matricule'];
            return false;
        } 
        targetUser.value = user
        step.value =2;
        return true;
    }catch(error){
        errors.matricule =['Erreur lors de la recuperation du matricule']
        console.log(error);
        return false;
    }
}

async function submitSendMoney(){
    errors.amount = null;
    if(!amount.value || Number(amount.value) <= 0){
        errors.amount = ['le montant doit être suppérieur à 0'];
        return false;
    }
    loading.value = true;
    try{
        const userId = localStorage.getItem('id')
        const users = await fetchUser();
        const currentUser = users.find(u => u.id == userId);
        if (currentUser.balance < amount.value) {
            errors.amount =["solde insuffisant  :", currentUser.balance];
            return false;
        }
        const response = await sendMoney(matricule.value, amount.value);
        transactionSummary.value= response;
        step.value=3;
        toast.add({ severity: "success", summary: "Succès", detail: "Dépôt effectué avec succès !" });
    }catch(error){
        if(error.response && error.response.data){
        errors.value = error.response.data;

        const msgs = Object.values(error.response.data)
        .flat()
        .map(v => String(v))
        .join(" | ");
        toast.add({ severity: "error", summary: "Erreur API", detail: msgs || "Erreur" });
        console.log(msgs);
    }else{
        toast.add({ severity: "error", summary: "Erreur", detail: "Échec du dépôt." });
    }
    }finally{
        loading.value = false;
    }
}
function newSend() {
  step.value = 1;
  matricule.value = "";
  amount.value = null;
  targetUser.value = {};
  errors.value = {};
  transactionSummary.value = null;
}



</script>

<template>
  <div class="flex justify-center items-start min-h-screen bg-gray-100 py-12">
    <div class="w-full md:w-3/4 lg:w-2/3">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">Envoi d'épargne</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-2">Envoyez de l'argent en toute sécurité</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center justify-between mb-10">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">1</div>
          <div class="flex-1 h-1 mx-4" :class="step>1 ? 'bg-blue-300' : 'bg-gray-300'"></div>
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">2</div>
          <div class="flex-1 h-1 mx-4" :class="step>2 ? 'bg-blue-300' : 'bg-gray-300'"></div>
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold', step===3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600']">3</div>
        </div>

        <!-- Step 1: Matricule -->
        <div v-if="step === 1" class="space-y-4">
          <label class="font-medium text-gray-700 dark:text-gray-200">Matricule du destinataire</label>
          <InputText v-model="matricule" placeholder="Ex: USR-12345" class="w-full border-gray-300 rounded-lg" />
          <div v-if="errors.matricule" class="text-red-600 text-sm">
            <div v-for="(e, i) in errors.matricule" :key="i">{{ e }}</div>
          </div>
          <div class="flex justify-end mt-4">
            <Button label="Suivant" icon="pi pi-arrow-right" class="p-button-rounded p-button-primary" @click="checkMatricule" />
          </div>
        </div>

        <!-- Step 2: Détails du compte + montant -->
        <div v-else-if="step === 2" class="space-y-4">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-inner">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Détails du destinataire</h3>
            <p><b>Nom :</b> {{ targetUser.first_name }} {{ targetUser.last_name }}</p>
            <p><b>Email :</b> {{ targetUser.email }}</p>
          </div>

          <label class="font-medium text-gray-700 dark:text-gray-200 mt-4">Montant à envoyer</label>
          <InputNumber v-model="amount" placeholder="0.00" mode="decimal" class="w-full border-gray-300 rounded-lg" />
          <div class="text-red-600 text-sm">
            <div v-for="(e, i) in errors.amount" :key="i">{{ e }}</div>
          </div>

          <div class="flex justify-between mt-6">
            <Button label="Retour" icon="pi pi-arrow-left" outlined @click="backToMatricule" />
            <Button label="Envoyer" icon="pi pi-send" class="p-button-success p-button-rounded" @click="submitSendMoney" :loading="loading" />
          </div>
        </div>

        <!-- Step 3: Résumé -->
        <div v-else-if="step === 3" class="space-y-4">
          <div class="bg-green-50 dark:bg-green-800 p-4 rounded-xl shadow-inner">
            <h3 class="text-lg font-semibold text-green-800 dark:text-green-100 mb-2">Résumé de l'envoi</h3>
            <p><b>Montant :</b> {{ amount}} USD</p>
            <p><b>Référence :</b> {{ transactionSummary.sender_transaction }}</p>
            <p><b>Nouveau solde :</b> {{ transactionSummary?.balances?.sender_balance }} USD</p>
          </div>

          <div class="flex justify-start mt-4">
            <Button label="Nouvel envoi" icon="pi pi-refresh" outlined @click="newSend" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
