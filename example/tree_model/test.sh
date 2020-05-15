#!/bin/bash

set -ex

cd "$( dirname "${BASH_SOURCE[0]}" )"

rm -rf exp data

python make_data.py --verify-example-ids=1 --dataset=iris

python -m fedlearner.model.tree.trainer follower \
    --verbosity=1 \
    --local-addr=localhost:50052 \
    --peer-addr=localhost:50051 \
    --verify-example-ids=true \
    --data-path=data/follower_train.data \
    --validation-data-path=data/follower_test/part-0001.data \
    --checkpoint-path=exp/follower_checkpoints \
    --output-path=exp/follower_train_output.output &

python -m fedlearner.model.tree.trainer leader \
    --verbosity=1 \
    --local-addr=localhost:50051 \
    --peer-addr=localhost:50052 \
    --verify-example-ids=true \
    --data-path=data/leader_train.data \
    --validation-data-path=data/leader_test/part-0001.data \
    --checkpoint-path=exp/leader_checkpoints \
    --output-path=exp/leader_train_output.output

wait

python -m fedlearner.model.tree.trainer leader \
    --verbosity=1 \
    --local-addr=localhost:50051 \
    --peer-addr=localhost:50052 \
    --mode=test \
    --verify-example-ids=true \
    --data-path=data/leader_test/ \
    --load-model-path=exp/leader_checkpoints/checkpoint-0004.proto \
    --output-path=exp/leader_test_output &

python -m fedlearner.model.tree.trainer follower \
    --verbosity=1 \
    --local-addr=localhost:50052 \
    --peer-addr=localhost:50051 \
    --mode=test \
    --verify-example-ids=true \
    --data-path=data/follower_test/ \
    --load-model-path=exp/follower_checkpoints/checkpoint-0004.proto \
    --output-path=exp/follower_test_output

wait


rm -rf exp data

python make_data.py --verify-example-ids=0 --dataset=iris

python -m fedlearner.model.tree.trainer follower \
    --verbosity=1 \
    --local-addr=localhost:50052 \
    --peer-addr=localhost:50051 \
    --verify-example-ids=false \
    --data-path=data/follower_train.data \
    --checkpoint-path=exp/follower_checkpoints \
    --output-path=exp/follower_train_output.output &

python -m fedlearner.model.tree.trainer leader \
    --verbosity=1 \
    --local-addr=localhost:50051 \
    --peer-addr=localhost:50052 \
    --verify-example-ids=false \
    --data-path=data/leader_train.data \
    --ignore-fields=f00000,f00001 \
    --checkpoint-path=exp/leader_checkpoints \
    --output-path=exp/leader_train_output.output

wait

python -m fedlearner.model.tree.trainer follower \
    --verbosity=2 \
    --local-addr=localhost:50052 \
    --peer-addr=localhost:50051 \
    --mode=test \
    --verify-example-ids=false \
    --data-path=data/follower_test/ \
    --load-model-path=exp/follower_checkpoints/checkpoint-0004.proto \
    --output-path=exp/follower_test_output &

python -m fedlearner.model.tree.trainer leader \
    --verbosity=2 \
    --local-addr=localhost:50051 \
    --peer-addr=localhost:50052 \
    --mode=test \
    --verify-example-ids=false \
    --no-data=true \
    --load-model-path=exp/leader_checkpoints/checkpoint-0004.proto \
    --output-path=exp/leader_test_output

wait