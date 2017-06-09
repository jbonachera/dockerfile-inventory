<template>
  <md-layout md-column>
    <md-layout md-align="center">
      <h2 class="md-title">Docker repository list for {{ user }}</h2>
    </md-layout>
    <md-layout md-align="center">
      <md-table>
        <md-table-header>
          <md-table-row>
            <md-table-head md-sort-by="name">Name</md-table-head>
            <md-table-head md-sort-by="baseImage">Base-Image</md-table-head>
            <md-table-head md-sort-by="hubName">Docker hub repository name
            </md-table-head>
            <md-table-head md-sort-by="size">Size</md-table-head>
          </md-table-row>
        </md-table-header>
        <md-table-body>
          <md-table-row v-for="(project, index) in projects" :key="index">
            <md-table-cell>{{ project.name }} </md-table-cell>
            <md-table-cell>{{ project.baseImage }} </md-table-cell>
            <md-table-cell>{{ project.hubName }} </md-table-cell>
            <md-table-cell>{{ project.size }} </md-table-cell>
          </md-table-row>
        </md-table-body>
      </md-table>
    </md-layout>
  </md-layout>
</template>
<script>
  export default {
    name: 'projectsList',
    data () {
      return {
        user: 'jbonachera',
        projects: [
          {
            name: 'docker-vernemq',
            baseImage: 'alpine',
            hubName: 'jbonachera/vernemq',
            size: '300Mo'
          }
        ]
      }
    }
  }
</script>
