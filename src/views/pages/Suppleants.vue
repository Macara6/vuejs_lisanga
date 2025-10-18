<script setup>

import { InputText } from 'primevue';
import { createSbstitute, fetchSubstitute,updateSubstitute, deleteSubstitute} from '@/service/Api';
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';



const toast = useToast();
const substituteDialog = ref(false);


const submitted = ref(false);
const first_name = ref('');
const last_name = ref('');
const email = ref('');
const adress = ref('');
const phone_number = ref('');
const editMode = ref(false);
const selectedSubstituteId = ref(null);
const deleteSubstituteDialog = ref(false);
const substitutes = ref([]);
const substituteToDelete = ref(null);
const searchQuery = ref("");






function openNew(){
    substituteDialog.value = true;
    submitted.value = false;
}
onMounted(() => {
    loadSubstitues();

});
async function loadSubstitues(){
    try{
        substitutes.value =await fetchSubstitute();
        console.log('liste des suppléant', substitutes.value);
    } catch(error){
        console.error('Error fetching substitutes', error);
    }
    
}
const filteredSubstitutes = computed(() => {
    if(!searchQuery.value) return substitutes.value;
    return substitutes.value.filter(sub => 
        sub.first_name.toLowerCase().includes(searchQuery.value.toLocaleLowerCase())||
        sub.last_name.toLowerCase().includes(searchQuery.value.toLocaleLowerCase()) ||
        sub.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

function editeSubstitute(sub){
    substituteDialog.value = true;
    editMode.value = true;
    selectedSubstituteId.value = sub.id;
    first_name.value = sub.first_name;
    last_name.value = sub.last_name;
    email.value = sub.email;
    adress.value = sub.adress;
    phone_number.value = sub.phone_number;

}

async function saveSbstitute(){
    submitted.value = true;

    if( !first_name.value || !last_name.value){
        return;
    }
    const payload = {
            first_name: first_name.value,
            last_name : last_name.value,
            phone_number:phone_number.value,
            email: email.value,
            adress:adress.value,
           
     };

    try {
        if(editMode.value){
            await updateSubstitute(selectedSubstituteId.value, payload);
            toast.add({ severity: 'success', summary: 'Modifié', detail: 'Suppléant mis à jour', life: 3000 });
        }else{
            await createSbstitute(payload);
            toast.add({ severity: 'success', summary: 'Ajouté', detail: 'Suppléant ajouté', life: 3000 });
        }
        substituteDialog.value = false;
        editMode.value = false;
        loadSubstitues();
    
        first_name.value = '';
        last_name.value ='';
        email.value = '';
        adress.value ='';
        phone_number.value ='';
    } catch(error){
        console.error('Error creating substitute',error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'error de creation du suppléant', life: 3000 });  
    }
}


function confirmDeleteSubstitute(sub){
    substituteToDelete.value = sub;
    deleteSubstituteDialog.value = true;
}

async function deleteSelectedSubstitute(){
    try{
        await deleteSubstitute(substituteToDelete.value.id);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Suppléant supprimé', life: 3000 });
        await loadSubstitues();
    } catch(error){
        console.error('Error deleting substitute', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Erreur lors de la suppression', life: 3000 });
    } finally{
       deleteSubstituteDialog.value = false;
       substituteToDelete.value = null;
    }
}



</script>

<template>
    <div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Liste des suppléants</div>

        <div class="flex justify-between items-center mb-4">
        <Button label="Nouveau suppléant" icon="pi pi-plus" severity="secondary" @click="openNew" />
        <!-- Barre de recherche -->
        <span class="p-input-icon-left">
           <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher...  " />
        </span>
        </div>
          
        <DataTable :value="filteredSubstitutes" scrollable scrollHeight="400px" class="mt-6">
            <Column field="id" header="ID" style="min-width: 80px"></Column>
            <Column field="first_name" header="Nom" style="min-width: 150px"></Column>
            <Column field="last_name" header="Post-nom" style="min-width: 150px"></Column>
            <Column field="email" header="Email" style="min-width: 200px"></Column>
            <Column field="adress" header="Adresse" style="min-width: 200px"></Column>
              <Column field="phone_number" header="Phone" style="min-width: 200px"></Column>
            <Column header="Actions" style="min-width: 150px">
            <template #body="{ data }">
                <Button  class="mr-1" icon="pi pi-pencil"   tooltip="Modifier" @click="editeSubstitute(data)" />
                <Button icon="pi pi-trash" severity="danger" @click="confirmDeleteSubstitute(data)" tooltip="Supprimer" />
            </template>
            </Column>
        </DataTable>
    </div>
    





     <Dialog
      v-model:visible="substituteDialog"
       :style="{ width: '450px' }" 
        :header="editMode? 'Modefier suppléant' :'Ajout suppléant' " 
       :modal="true"

       >
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-3">Nom</label>
                    <InputText id="first_name" v-model="first_name" required="true" autofocus :invalid="submitted && !first_name" fluid />
                     <small v-if="submitted && !first_name" class="text-red-500">Nom requis.</small>
                </div>
                 <div>
                    <label for="name" class="block font-bold mb-3">Post-Nom</label>
                    <InputText id="last_name" v-model="last_name" required="true" autofocus :invalid="submitted && !last_name" fluid />
                     <small v-if="submitted && !last_name" class="text-red-500">Post-nom requis.</small>
                </div>
               

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="email" class="block font-bold mb-3">E-mail </label>
                        <InputText id="email" v-model="email" placeholder="ex: text@gmail.com" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="adress" class="block font-bold mb-3">Adresse </label>
                        <InputText id="adress" v-model="adress" placeholder="ex: kinshasa/limete/" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="phone" class="block font-bold mb-3">Tél</label>
                        <InputText id="phone" v-model="phone_number" integeronly fluid />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="substituteDialog = false" />
                <Button label="Save" icon="pi pi-check"  @click="saveSbstitute" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteSubstituteDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Êtes-vous sûr de vouloir supprimer ce suppléant ?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteSubstituteDialog = false" />
                <Button label="Yes" icon="pi pi-check"  text @click="deleteSelectedSubstitute"  />
            </template>
        </Dialog>

</div>
</template>