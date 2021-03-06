const assert = require('assert');
const lodash = require('lodash');

const permittedJobEnvs = {
  data_join: [],
  psi_data_join: [],
  tree_model: [
    'VERBOSITY', 'LEARNING_RATE', 'MAX_ITERS', 'MAX_DEPTH',
    'L2_REGULARIZATION', 'MAX_BINS', 'NUM_PARALELL',
    'VERIFY_EXAMPLE_IDS', 'USE_STREAMING',
  ],
  nn_model: ['MODEL_NAME'],
};

function mergeCustomizer(obj, src) {
  if (lodash.isArray(obj) && lodash.isArray(src)) {
    return obj.concat(src);
  }
}

function mergeJson(obj, src) {
  return lodash.mergeWith(obj, src, mergeCustomizer);
}

/**
 * validate ticket and params, just throw error if validation failed
 *
 * @param {Object} ticket - a Ticket model instance
 * @param {Object} params - a JSON object
 * @return {boolean}
 */
function validateTicket(ticket, params) {
  return true;
}

function clientValidateJob(job, client_ticket, server_ticket) {
  return true;
}

// Only allow some fields to be used from job.server_params because
// it is received from peers and cannot be totally trusted.
function extractPermittedJobParams(job) {
  const params = job.server_params;
  const permitted_envs = permittedJobEnvs[job.job_type];
  const extracted = {};

  if (!params || !params.spec || !params.spec.flReplicaSpecs) {
    return extracted;
  }

  extracted.spec = { flReplicaSpecs: {} };

  for (const key in params.spec.flReplicaSpecs) {
    const obj = extracted.spec.flReplicaSpecs[key] = {};
    const src = params.spec.flReplicaSpecs[key];
    if (src.replicas) {
      obj.replicas = src.replicas;
    }
    if (src.template && src.template.spec
      && src.template.spec.containers) {
      obj.template = { spec: { containers: {} } };
      if (src.template.spec.containers.resources) {
        obj.template.spec.containers.resources = src.template.spec.containers.resources;
      }
      if (src.template.spec.containers
        && lodash.isArray(src.template.spec.containers.env)) {
        const obj_envs = obj.template.spec.containers.env = [];
        const src_envs = src.template.spec.containers.env;
        for (const i in src_envs) {
          const kv = src_envs[i];
          if (permitted_envs.includes(kv.name)
            && typeof (kv.value) === 'string') {
            obj_envs.push({
              name: kv.name,
              value: kv.value,
            });
          }
        }
      }
    }
  }

  return extracted;
}

function serverValidateJob(job, client_ticket, server_ticket) {
  const extracted = extractPermittedJobParams(job);
  assert.deepStrictEqual(job.server_params, extracted);
  return true;
}

function generateYaml(federation, job, job_params, ticket) {
  const { k8s_settings } = federation;
  let yaml = mergeJson({}, k8s_settings.global_job_spec);

  let peer_spec = k8s_settings.leader_peer_spec;
  if (ticket.role == 'follower') {
    peer_spec = k8s_settings.follower_peer_spec;
  }
  yaml = mergeJson(yaml, {
    metadata: {
      name: job.name,
    },
    spec: {
      role: ticket.role,
      cleanPodPolicy: 'None',
      peerSpecs: peer_spec,
    },
  });

  yaml = mergeJson(yaml, ticket.public_params);
  yaml = mergeJson(yaml, ticket.private_params);

  const replica_specs = yaml.spec.flReplicaSpecs;
  for (const key in replica_specs) {
    let base_spec = mergeJson({}, k8s_settings.global_replica_spec);
    base_spec = mergeJson(base_spec, {
      template: {
        spec: {
          containers: {
            env: [
              { name: 'ROLE', value: ticket.role },
              { name: 'APPLICATION_ID', value: job.name },
            ],
          },
        },
      },
    });
    replica_specs[key] = mergeJson(
      base_spec, replica_specs[key],
    );
  }

  yaml = mergeJson(yaml, job_params);

  return yaml;
}

function clientGenerateYaml(federation, job, client_ticket) {
  return generateYaml(federation, job, job.client_params, client_ticket);
}

/**
 * used for job creation at server-side
 *
 * @param {Object} federation - Federation instance
 * @param {Object} job - Job instance
 * @param {Object} server_ticket - Ticket instance
 * @return {Object} - a YAML object
 */
function serverGenerateYaml(federation, job, server_ticket) {
  return generateYaml(
    federation, job,
    extractPermittedJobParams(job),
    server_ticket,
  );
}

module.exports = {
  validateTicket,
  clientValidateJob,
  serverValidateJob,
  clientGenerateYaml,
  serverGenerateYaml,
};
