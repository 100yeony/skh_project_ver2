#!/bin/bash
IFS=$'\n' ARR=(`grep -w 'server_IP' InstallConfig | tr -d ' ' | tr '=' '\n'`) #server ip
IFS=$'\n' ARR2=(`grep -w 'nodes_IP' InstallConfig | tr -d ' ' | tr '=' '\n'`) 
IFS=$'\n' ARR3=(`echo ${ARR2[1]} | tr ',' '\n'`) #node ip list

ssh-keygen -N '' -f ~/.ssh/id_rsa <<< n
for node in ${ARR3[@]};
do
 echo $node	
 ssh-copy-id root@$node
 ssh root@$node ssh-keygen -N '' -f ~/.ssh/id_rsa <<< n
 ssh root@$node ssh-copy-id root@${ARR[1]}
done


