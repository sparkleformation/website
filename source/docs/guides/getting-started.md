---
title: "Getting Started"
weight: 1
anchors:
  - title: "Requirements"
    url: "#requirements"
  - title: "Installation"
    url: "#installation"
  - title: "Configuration"
    url: "#configuration"
  - title: "Setup"
    url: "#setup"
  - title: "Create a template"
    url: "#create-a-template"
  - title: "Create a new stack"
    url: "#create-a-new-stack"
  - title: "Template refactor"
    url: "#template-refactor"
  - title: "Stack update"
    url: "#stack-update"
  - title: "Stack information"
    url: "#stack-information"
  - title: "Clean up"
    url: "#clean-up"
---

## Requirements

* Ruby (Version `>=` 2.0)
* Bundler
* Provider Credentials

### Installing Ruby

There are a variety of ways to install Ruby depending on platform and toolset. The
Ruby website provides information about many of the installation options:

* [Installing Ruby](https://www.ruby-lang.org/en/documentation/installation/)

### Installing Bundler

Once Ruby is installed, install Bundler using the `gem` command:

~~~
$ gem install bundler
~~~

### Provider credentials

Required credentials differ based on the target provider in use. For more information
about credentials specific to a certain provider, reference the miasma library for
the provider:

* [miasma-aws](https://github.com/miasma-rb/miasma-aws)
* [miasma-azure](https://github.com/miasma-rb/miasma-azure)
* [miasma-open-stack](https://github.com/miasma-rb/miasma-open-stack)
* [miasma-rackspace](https://github.com/miasma-rb/miasma-rackspace)

## Installation

First, create a project directory. For this guide, we will use a directory
named `sparkle-guide`:

~~~
$ mkdir sparkle-guide
$ cd sparkle-guide
~~~

Create a Gemfile to provide a local bundle:

~~~ruby
# ./Gemfile
source 'https://rubygems.org'

gem 'sfn'
~~~

Install the bundle:

~~~
$ bundle install
~~~

## Configuration

Generate the default configuration file:

~~~
$ bundle exec sfn conf --generate
~~~

This command will create a new configuration file at `.sfn`. Open this file
and adjust the credentials section for your desired provider. The generated
configuration file uses environment variables for provider configuration. This
style of setup makes it easy to automatically set credential information using
tools like direnv. Environment variable usage is not required, and credential
values can be provided directly.

_NOTE: It is important to **not** store provider credential secrets within the
`.sfn` file if it will be checked into source control._

### Test configuration

Test the configuration by running a list command:

~~~
$ bundle exec sfn list
~~~

This should print a list of existing stacks on the configured provider. If no
stacks exist, no entries will be shown. If an error message is received, check
that the credentials information is properly set and try again.

## Setup

Create directories for [SparkleFormation Building Blocks](../sparkle_formation/building-blocks.html):

~~~
$ mkdir sparkleformation
$ mkdir sparkleformation/registry
$ mkdir sparkleformation/components
$ mkdir sparkleformation/dynamics
~~~

## Create a template

Lets start by creating a full template. This template will create a compute resource
on the desired provider and output the remote public address of the new compute instance.

Create a new file: `./sparkleformation/compute.rb`:

#### Template sparkles AWS

~~~ruby
SparkleFormation.new(:compute, :provider => :aws) do
  AWSTemplateFormatVersion '2010-09-09'
  description 'Sparkle Guide Compute Template'

  parameters do
    sparkle_image_id.type 'String'
    sparkle_ssh_key_name.type 'String'
    sparkle_flavor do
      type 'String'
      default 'm1.small'
      allowed_values ['m1.small', 'm1.medium']
    end
  end

  dynamic!(:ec2_instance, :sparkle) do
    properties do
      image_id ref!(:sparkle_image_id)
      instance_type ref!(:sparkle_flavor)
      key_name ref!(:sparkle_ssh_key_name)
    end
  end

  outputs.sparkle_public_address do
    description 'Compute instance public address'
    value attr!(:sparkle_ec2_instance, :public_ip)
  end

end
~~~

#### Template sparkles HEAT

~~~ruby
SparkleFormation.new(:compute, :provider => :heat) do
  heat_template_version '2015-04-30'
  description 'Sparkle Guide Compute Template'

  parameters do
    sparkle_image_id.type 'String'
    sparkle_ssh_key_name.type 'String'
    sparkle_flavor do
      type 'String'
      default 'm1.small'
      allowed_values ['m1.small', 'm1.medium']
    end
  end

  dynamic!(:nova_server, :sparkle) do
    properties do
      image ref!(:sparkle_image_id)
      flavor ref!(:sparkle_flavor)
      key_name ref!(:sparkle_ssh_key_name)
    end
  end

  outputs.sparkle_public_address do
    description 'Compute instance public address'
    value attr!(:sparkle_nova_instance, 'accessIPv4')
  end

end
~~~

#### Template sparkles Azure

~~~ruby
SparkleFormation.new(:compute, :provider => :azure) do
  set!('$schema', 'https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#')
  content_version '1.0.0.0'
  parameters do
    sparkle_image_id do
      type 'string'
      default_value '14.04.2-LTS'
    end
    sparkle_flavor do
      type 'string'
      allowed_values [
        'Standard_D1'
      ]
    end
    storage_account_name.type 'string'
    storage_container_name.type 'string'
  end

  dynamic!(:network_public_ip_addresses, :sparkle) do
    properties do
      set!('publicIPAllocationMethod', 'Dynamic')
      dns_settings.domain_name_label 'sparkle'
    end
  end

  dynamic!(:network_virtual_networks, :sparkle) do
    properties do
      address_space.address_prefixes ['10.0.0.0/16']
      subnets array!(
        ->{
          name 'sparkle-subnet'
          properties.address_prefix '10.0.0.0/24'
        }
      )
    end
  end

  dynamic!(:network_interfaces, :sparkle) do
    properties.ip_configurations array!(
      ->{
        name 'ipconfig1'
        properties do
          set!('privateIPAllocationMethod', 'Dynamic')
          set!('publicIPAddress').id resource_id!(:sparkle_network_public_ip_addresses)
          subnet.id concat!(resource_id!(:sparkle_network_virtual_networks), '/subnets/sparkle-subnet')
        end
      }
    )
  end

  dynamic!(:compute_virtual_machines, :sparkle) do
    properties do
      hardware_profile.vm_size parameters!(:sparkle_flavor)
      os_profile do
        computer_name 'sparkle'
        admin_username 'sparkle'
        admin_password 'SparkleFormation2016'
      end
      storage_profile do
        image_reference do
          publisher 'Canonical'
          offer 'UbuntuServer'
          sku parameters!(:sparkle_image_id)
          version 'latest'
        end
        os_disk do
          name 'osdisk'
          vhd.uri concat!('http://', parameters!(:storage_account_name), '.blob.core.windows.net/', parameters!(:storage_container_name), '/sparkle.vhd')
          caching 'ReadWrite'
          create_option 'FromImage'
        end
        data_disks array!(
          ->{
            name 'datadisk1'
            set!('diskSizeGB', 100)
            lun 0
            vhd.uri concat!('http://', parameters!(:storage_account_name), '.blob.core.windows.net/', parameters!(:storage_container_name), '/sparkle-data.vhd')
            create_option 'Empty'
          }
        )
      end
      network_profile.network_interfaces array!(
        ->{ id resource_id!(:sparkle_network_interfaces) }
      )
    end
  end

  outputs.sparkle_public_address do
    type 'string'
    value reference!(:sparkle_network_public_ip_addresses).ipAddress
  end
end
~~~

### View template

View the processed JSON result:

~~~
$ bundle exec sfn print --file compute
~~~

This will output the serialized JSON template generated by SparkleFormation. The JSON is the template
content which will be sent to the remote provider API with the stack create request.

## Create a new stack

After seeing the result of the compiled and serialized template, lets use that template to
create a new stack. To start the stack creation process run the following command:

~~~
$ bundle exec sfn create sparkle-guide-compute --file compute
~~~

Before creating this new stack, `sfn` will prompt for the parameters defined within the template.
The `sparkle_image_id` and `sparkle_ssh_key_name` parameters are not defined with default values within the template,
so values _must_ be provided when prompted. The prompt for the `sparkle_flavor` parameter will show the
default value defined within the template, and can be used or overridden with a different value.

After `sfn` has completed prompting for stack parameters, it will initiate the stack creation
request with the remote provider. The creation request to the API is only for initiation. A successful
response does not indicate that the stack was created successfully, rather it indicates that the request
to create the stack was successful.

Once the create request is complete, `sfn` will automatically transition to event polling. Resource
events related to the new stack will be displayed until the stack reaches a "complete" state: success
or failure. The automatic transition to event polling ensures that the `sfn create` command will return
a proper exit code once the stack has reached a completion state.

At successful completion of the stack creation, the outputs defined within the template will be displayed
showing the public address of the newly created compute instance.

## Template refactor

A key feature of SparkleFormation is the ability to break down templates into reusable parts which can
then be re-used in multiple templates. Lets break down our existing template into re-usable parts and
re-build the template using those parts.

### Registry

The registry is a place to store values that may be used in multiple places. With the value defined in
a single location, updates to the value only require one modification to apply globally. In our `compute`
example, the allowed instance flavor values would an ideal candidate for a registry entry.

Create a new file at `./sparkleformation/registry/instance_flavor.rb`

#### Registry sparkles AWS

~~~ruby
SfnRegistry.register(:instance_flavor) do
  ['m1.small', 'm1.medium']
end
~~~

#### Registry sparkles HEAT

~~~ruby
SfnRegistry.register(:instance_flavor) do
  ['m1.small', 'm1.medium']
end
~~~

#### Registry sparkles Azure
~~~ruby
SfnRegistry.register(:instance_flavor) do
  ['Standard_D1']
end
~~~

_NOTE: For more information see: [Registry building blocks](../sparkle_formation/building-blocks.html#registry)_

### Component

Components are items which are used a single time within a template. The version information and description
are both items in our `compute` template that are only used a single time, but should be defined in all templates.
Lets move those items into a component.

Create a new file at `./sparkleformation/components/base.rb`

#### Component sparkles AWS

~~~ruby
SparkleFormation.component(:base) do
  AWSTemplateFormatVersion '2010-09-09'
  description 'Sparkle Guide Compute Template'
end
~~~

#### Component sparkles HEAT

~~~ruby
SparkleFormation.component(:base) do
  heat_template_version '2015-04-30'
  description 'Sparkle Guide Compute Template'
end
~~~

#### Component sparkles Azure

~~~ruby
SparkleFormation.component(:base) do
  set!('$schema', 'https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#')
  content_version '1.0.0.0'
end
~~~

_NOTE: For more information see: [Component building blocks](../sparkle_formation/building-blocks.html#components)_

### Dynamic

Dynamics are items which can be used multiple times within a template. A dynamic requires a custom name be provided
and allows for an optional Hash of values. Dynamics are useful for injecting a common structure into a template
multiple times. In the `compute` template above, we can now extract the remainder of the template and convert it
into a dynamic.

Create a new file at `./sparkleformation/dynamics/node.rb`

#### Dynamic sparkles AWS

~~~ruby
SparkleFormation.dynamic(:node) do |name, opts={}|

  parameters do
    set!("#{name}_image_id".to_sym).type 'String'
    set!("#{name}_ssh_key_name".to_sym).type 'String'
    set!("#{name}_flavor".to_sym) do
      type 'String'
      default 'm1.small'
      allowed_values registry!(:instance_flavor)
    end
  end

  outputs.set!("#{name}_public_address".to_sym) do
    description "Compute instance public address - #{name}"
    value attr!("#{name}_ec2_instance".to_sym, :public_ip)
  end

  dynamic!(:ec2_instance, name) do
    properties do
      image_id ref!("#{name}_image_id".to_sym)
      instance_type ref!("#{name}_flavor".to_sym)
      key_name ref!("#{name}_ssh_key_name".to_sym)
    end
  end

end
~~~

#### Dynamic sparkles HEAT

~~~ruby
SparkleFormation.dynamic(:node) do |name, opts={}|

  parameters do
    set!("#{name}_image_id".to_sym).type 'String'
    set!("#{name}_ssh_key_name".to_sym).type 'String'
    set!("#{name}_flavor".to_sym) do
      type 'String'
      default 'm1.small'
      allowed_values registry!(:instance_flavor)
    end
  end

  outputs.set!("#{name}_public_address".to_sym) do
    description "Compute instance public address - #{name}"
    value attr!("#{name}_nova_server".to_sym, 'accessIPv4')
  end

  dynamic!(:nova_server, name) do
    properties do
      image ref!("#{name}_image_id".to_sym)
      flavor ref!("#{name}_flavor".to_sym)
      key_name ref!("#{name}_ssh_key_name".to_sym)
    end
  end

end
~~~

#### Dynamic sparkles Azure

~~~~ruby
SparkleFormation.dynamic(:node) do |name, opts={}|
  parameters do
    set!("#{name}_image_id".to_sym) do
      type 'string'
      default_value '14.04.2-LTS'
    end
    set!("#{name}_flavor".to_sym) do
      type 'string'
      allowed_values registry!(:instance_flavor)
    end
  end

  dynamic!(:network_public_ip_addresses, name) do
    properties do
      set!('publicIPAllocationMethod', 'Dynamic')
      dns_settings.domain_name_label name
    end
  end

  dynamic!(:network_interfaces, name) do
    properties.ip_configurations array!(
      ->{
        name 'ipconfig1'
        properties do
          set!('privateIPAllocationMethod', 'Dynamic')
          set!('publicIPAddress').id resource_id!("#{name}_network_public_ip_addresses".to_sym)
          subnet.id concat!(resource_id!("#{name}_network_virtual_networks".to_sym), '/subnets/sparkle-subnet')
        end
      }
    )
  end

  dynamic!(:compute_virtual_machines, name) do
    properties do
      hardware_profile.vm_size parameters!("#{name}_flavor".to_sym)
      os_profile do
        computer_name 'sparkle'
        admin_username 'sparkle'
        admin_password 'SparkleFormation2016'
      end
      storage_profile do
        image_reference do
          publisher 'Canonical'
          offer 'UbuntuServer'
          sku parameters!("#{name}_image_id".to_sym)
          version 'latest'
        end
        os_disk do
          name 'osdisk'
          vhd.uri concat!('http://', parameters!(:storage_account_name), '.blob.core.windows.net/', parameters!(:storage_container_name), "/#{name}.vhd")
          caching 'ReadWrite'
          create_option 'FromImage'
        end
        data_disks array!(
          ->{
            name 'datadisk1'
            set!('diskSizeGB', 100)
            lun 0
            vhd.uri concat!('http://', parameters!(:storage_account_name), '.blob.core.windows.net/', parameters!(:storage_container_name), "/#{name}-data.vhd")
            create_option 'Empty'
          }
        )
      end
      network_profile.network_interfaces array!(
        ->{ id resource_id!("#{name}_network_interfaces".to_sym) }
      )
    end
  end

  outputs.set!("#{name}_public_address".to_sym) do
    type 'string'
    value reference!("#{name}_network_public_ip_addresses".to_sym).ipAddress
  end
end
~~~~

The first thing to note about this dynamic file is the `name` argument at the top.

`SparkleFormation.dynamic(:node) do |name, opts={}|`

This variable is used throughout the dynamic to provide uniquely named parameters, resources, and outputs. Also
note the use of they registry to define the allowed values for the flavor parameter.

`allowed_values registry!(:instance_flavor)`

_NOTE: For more information see: [Dynamic building blocks](../sparkle_formation/building-blocks.html#dynamics)_

### Template

Now that the original template has been refactored into re-usable parts, lets update our `./sparkleformation/compute.rb`
template:

#### Template sparkles AWS

~~~ruby
SparkleFormation.new(:compute, :provider => :aws).load(:base).overrides do
  dynamic!(:node, :sparkle)
end
~~~

#### Template sparkles HEAT

~~~ruby
SparkleFormation.new(:compute, :provider => :heat).load(:base).overrides do
  dynamic!(:node, :sparkle)
end
~~~

#### Template sparkles Azure

~~~ruby
SparkleFormation.new(:compute, :provider => :azure).load(:base).overrides do
  parameters do
    storage_account_name.type 'string'
    storage_container_name.type 'string'
  end

  dynamic!(:network_virtual_networks, :sparkle) do
    properties do
      address_space.address_prefixes ['10.0.0.0/16']
      subnets array!(
        ->{
          name 'sparkle-subnet'
          properties.address_prefix '10.0.0.0/24'
        }
      )
    end
  end

  dynamic!(:node, :sparkle)
end
~~~

The template is now greatly compacted, and composed entirely of re-usable parts. The `.load(:base)` is inserting
the base component we defined above. The `dynamic!(:node, :sparkle)` is inserting the node dynamic we defined
above and using the custom name `sparkle`. We can print this template, and see the result is the same as the original
template.

~~~
$ sfn print --file compute
~~~

## Stack update

### The NO-OP update

We can verify that our new template is the same as our original template by updating the running stack and applying
our new template:

~~~
$ sfn update sparkle-guide-compute --file compute --defaults
~~~

The `--defaults` flag will suppress prompts for stack parameters and use the existing values defined for the running
stack. The result of this command will either explicitly state that no updates were performed, or the event stream
will show that no resources were modified depending on the provider.

### The real update (parameters)

Now lets update the stack by modifying the paramters of the running stack. We will change the flavor of the instance
which will result in the resource being replaced within the stack. Run the update command but do not provide any
flags:

~~~
$ sfn update sparkle-guide-compute
~~~

Now `sfn` will prompt for parameter values. Notice that the default values are the values used when creating the
stack. When the `sparkle_flavor` parameter is prompted, choose a different value from the allowed list. After the
update has completed, the outputs displayed of the stack will have changed showing a new public address for the
compute instance.

### The real update (template)

Since our template has been refactored and is now composed of re-usable parts, it's easy to quickly expand our stack.
Lets add an additional compute resource to our `./sparkleformation/compute.rb` template:

#### Template sparkles AWS

~~~ruby
SparkleFormation.new(:compute, :provider => :aws).load(:base).overrides do
  dynamic!(:node, :sparkle)
  dynamic!(:node, :unicorn)
end
~~~

#### Template sparkles HEAT

~~~ruby
SparkleFormation.new(:compute, :provider => :heat).load(:base).overrides do
  dynamic!(:node, :sparkle)
  dynamic!(:node, :unicorn)
end
~~~

#### Template sparkles Azure

~~~ruby
SparkleFormation.new(:compute, :provider => :azure).load(:base).overrides do
  parameters do
    storage_account_name.type 'string'
    storage_container_name.type 'string'
  end

  dynamic!(:network_virtual_networks, :sparkle) do
    properties do
      address_space.address_prefixes ['10.0.0.0/16']
      subnets array!(
        ->{
          name 'sparkle-subnet'
          properties.address_prefix '10.0.0.0/24'
        }
      )
    end
  end

  dynamic!(:node, :sparkle)
  dynamic!(:node, :unicorn)
end
~~~


Printing the template we can see that by adding a single line we have added not only a new resource to our template,
but a new output as well.

~~~
$ sfn print --file compute
~~~

Now we can apply this updated template to our existing stack. On this update command, we _must_ provide the `--file`
flag so our modified template will be sent in our request:

~~~
$ sfn update sparkle-guide-compute --file compute
~~~

When `sfn` prompts for parameters, the previously seen `sparkle` parameters will be requested, but we will also
see new `unicorn` parameters requested for the new compute resource we added. After the update has completed the
stack outputs will be displayed and will now include two public addresses: one for `sparkle` and one for `unicorn`.

## Stack information

With stacks currently existing on the remote provider, we can now use the inspection commands:

~~~
$ sfn list
~~~

Will provide a list of current stacks. This may include only the `sparkle-guide-compute` stack or it may include
other stacks that were created by other users or the provider itself.

We can also describe a specific stack. The describe command will list all the resources composing the requested
stack, as well as any stack outputs defined for the stack:

~~~
$ sfn describe sparkle-guide-compute
~~~

## Clean up

To conclude this guide, we want to be sure to remove the example stack we created. This is done using the
destroy command:

~~~
$ sfn destroy sparkle-guide-compute
~~~
